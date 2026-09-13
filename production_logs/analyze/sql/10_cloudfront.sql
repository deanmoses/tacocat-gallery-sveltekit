-- CloudFront standard access logs for every environment and distribution pulled.
--
-- SOURCE: ../../dumps/cloudfront/<env>/<distribution>/YYYY/MM/DD/*.gz, one file per
-- edge location per hour or so, tab-separated, with a `#Version` line and a
-- `#Fields` line naming the columns. Fixtures are plain .tsv so they can be read
-- in a diff; the reader takes both.
--
-- THE FIELD LIST IS PER FILE. It is whatever the log delivery was configured to
-- emit when that file was written, and it changed on 2026-09-11: cookie,
-- forwarded-for, field-level-encryption and range fields went away, `asn` and
-- `c-country` arrived. So nothing here assumes a column order. Each line is read
-- whole, split on tabs, and every column below is looked up by CloudFront''s own
-- field name in that file''s header -- NULL when the file predates the field.
-- Some columns read fields the delivery may not be configured to emit yet; those
-- are NULL until it is, and `aws logs describe-configuration-templates --service
-- cloudfront` lists every field it can.
--
-- Text fields are URL-encoded on the wire (a space in a user agent is %20) and
-- `-` is CloudFront''s empty marker in every column.

-- One row per line of every file, header lines included. The unit separator
-- never occurs in a log line, so each line lands whole in one column; quote and
-- escape are off so a stray quote in a user agent cannot swallow the rest of the
-- file. chr() because DuckDB string literals do not process escapes.
--
-- The file list is gathered first because read_csv rejects a list of globs when
-- any one of them matches nothing, and a dump holds either .gz or .tsv, not both.
SET VARIABLE cf_files = (
  SELECT list(file) FROM (
    FROM glob('../../dumps/cloudfront/**/*.gz') UNION ALL FROM glob('../../dumps/cloudfront/**/*.tsv')
  )
);

CREATE TEMP TABLE cf_lines AS
SELECT filename, line
FROM read_csv(getvariable('cf_files'),
  columns = {'line': 'VARCHAR'}, delim = chr(31), quote = '', escape = '',
  header = false, comment = '', filename = true);

CREATE OR REPLACE MACRO cf_field(cols, fields, name) AS cols[list_position(fields, name)];

CREATE OR REPLACE TABLE cloudfront_files AS
WITH headers AS (
  SELECT filename,
         count(*) AS header_lines,
         any_value(string_split(regexp_replace(line, '^#Fields: ', ''), ' ')) AS fields
  FROM cf_lines WHERE line LIKE '#Fields:%' GROUP BY filename
),
data AS (
  SELECT l.filename,
         count(*) AS rows,
         count(*) FILTER (len(string_split(l.line, chr(9))) <> len(h.fields)) AS malformed_rows
  FROM cf_lines l LEFT JOIN headers h USING (filename)
  WHERE l.line NOT LIKE '#%' GROUP BY l.filename
)
SELECT
  regexp_replace(f.filename, '^.*/dumps/cloudfront/', '') AS source_file,
  regexp_extract(f.filename, 'dumps/cloudfront/([^/]+)/([^/]+)/', 1) AS env,
  regexp_extract(f.filename, 'dumps/cloudfront/([^/]+)/([^/]+)/', 2) AS distribution,
  coalesce(h.header_lines, 0) AS header_lines,
  h.fields,
  coalesce(d.rows, 0) AS rows,
  coalesce(d.malformed_rows, 0) AS malformed_rows,
  f.filename
FROM (SELECT DISTINCT filename FROM cf_lines) f
LEFT JOIN headers h USING (filename)
LEFT JOIN data d USING (filename);

COMMENT ON TABLE cloudfront_files IS 'GRAIN: one row per log file read, with the field list its header declared. `malformed_rows` counts lines whose column count disagreed with that header; they are absent from cloudfront_requests.';

CREATE OR REPLACE TABLE cloudfront_requests AS
WITH lines AS (
  SELECT f.env, f.distribution, f.source_file, f.fields, string_split(l.line, chr(9)) AS cols
  FROM cf_lines l
  JOIN cloudfront_files f USING (filename)
  WHERE l.line NOT LIKE '#%' AND f.header_lines = 1
    AND len(string_split(l.line, chr(9))) = len(f.fields)
)
SELECT
  -- When the edge finished responding. `timestamp(ms)` carries the same instant
  -- to the millisecond; `date` and `time` only to the second, so requests within
  -- one page load tie without it.
  coalesce(
    make_timestamp(try_cast(nullif(cf_field(cols, fields, 'timestamp(ms)'), '-') AS BIGINT) * 1000),
    try_cast(cf_field(cols, fields, 'date') || ' ' || cf_field(cols, fields, 'time') AS TIMESTAMP)
  ) AS ts,
  env,
  distribution,
  cf_field(cols, fields, 'x-edge-location') AS edge_location,
  cf_field(cols, fields, 'c-ip') AS client_ip,
  -- With the IP and edge, identifies the viewer''s connection: see `connections`.
  try_cast(nullif(cf_field(cols, fields, 'c-port'), '-') AS INTEGER) AS client_port,
  -- Present only in files written after 2026-09-11. NULL says the file predates
  -- the field, not that CloudFront had no answer.
  nullif(cf_field(cols, fields, 'c-country'), '-') AS country,
  try_cast(nullif(cf_field(cols, fields, 'asn'), '-') AS BIGINT) AS asn,
  cf_field(cols, fields, 'cs-method') AS method,
  -- The name the client asked for. cs(Host) is the distribution''s own
  -- cloudfront.net name and says nothing a directory does not.
  cf_field(cols, fields, 'x-host-header') AS host,
  cf_field(cols, fields, 'cs-uri-stem') AS path,
  nullif(cf_field(cols, fields, 'cs-uri-query'), '-') AS query,
  try_cast(cf_field(cols, fields, 'sc-status') AS INTEGER) AS status,
  nullif(url_decode(cf_field(cols, fields, 'cs(Referer)')), '-') AS referer,
  nullif(url_decode(cf_field(cols, fields, 'cs(User-Agent)')), '-') AS user_agent,
  is_probe_ua(nullif(url_decode(cf_field(cols, fields, 'cs(User-Agent)')), '-')) AS is_probe,
  -- Hit, RefreshHit, Miss, LimitExceeded, CapacityExceeded, Error, Redirect.
  -- Only the first two were answered from the edge.
  cf_field(cols, fields, 'x-edge-result-type') AS result_type,
  (cf_field(cols, fields, 'x-edge-result-type') IN ('Hit', 'RefreshHit')) AS is_cache_hit,
  cf_field(cols, fields, 'x-edge-detailed-result-type') AS detailed_result_type,
  try_cast(cf_field(cols, fields, 'sc-bytes') AS BIGINT) AS bytes_sent,
  try_cast(cf_field(cols, fields, 'cs-bytes') AS BIGINT) AS bytes_received,
  try_cast(nullif(cf_field(cols, fields, 'time-taken'), '-') AS DOUBLE) AS seconds,
  try_cast(nullif(cf_field(cols, fields, 'time-to-first-byte'), '-') AS DOUBLE) AS ttfb_seconds,
  -- The edge''s wait on the origin: first byte, then last. NULL on a cache hit,
  -- which never asked it. The gap between these and the viewer-side timings is
  -- CloudFront''s own share of a request.
  try_cast(nullif(cf_field(cols, fields, 'origin-fbl'), '-') AS DOUBLE) AS origin_ttfb_seconds,
  try_cast(nullif(cf_field(cols, fields, 'origin-lbl'), '-') AS DOUBLE) AS origin_seconds,
  -- The PathPattern of the behavior that answered, `*` for the default one.
  nullif(cf_field(cols, fields, 'cache-behavior-path-pattern'), '-') AS cache_behavior,
  cf_field(cols, fields, 'cs-protocol') AS scheme,
  cf_field(cols, fields, 'cs-protocol-version') AS http_version,
  nullif(cf_field(cols, fields, 'ssl-protocol'), '-') AS tls_version,
  nullif(cf_field(cols, fields, 'sc-content-type'), '-') AS content_type,
  cf_field(cols, fields, 'x-edge-request-id') AS request_id,
  source_file
FROM lines;

COMMENT ON TABLE cloudfront_requests IS 'GRAIN: one row per request at the CloudFront edge, both distributions, every environment pulled. Cache hits included: this is what clients got, not what reached S3. `is_probe` marks the project''s own probes; visitors and everything built on it leave them out, this relation does not. Columns a file predates are NULL.';
