-- CloudFront standard access logs for every environment and distribution pulled.
--
-- SOURCE: ../../dumps/cloudfront/<env>/<distribution>/YYYY/MM/DD/*.gz, one file per
-- edge location per hour or so, tab-separated, with a `#Version` line and a
-- `#Fields` line naming the columns. Fixtures are plain .tsv so they can be read
-- in a diff; the reader takes both.
--
-- THE FIELD LIST IS PER FILE. It is whatever the log delivery was configured to
-- emit when that file was written, and it has changed twice: on 2026-09-11
-- cookie, forwarded-for, field-level-encryption and range fields went away and
-- `asn` and `c-country` arrived; on 2026-09-13 `timestamp(ms)`, `origin-fbl`,
-- `origin-lbl` and `cache-behavior-path-pattern` were appended. So nothing here
-- assumes a column order. Each line is read whole, split on tabs, and every
-- column below is looked up by CloudFront''s own field name in that file''s
-- header -- NULL when the file predates the field. `aws logs
-- describe-configuration-templates --service cloudfront` lists every field the
-- delivery can emit.
--
-- Text fields are URL-encoded on the wire (a space in a user agent is %20) and
-- `-` is CloudFront''s empty marker in every column.

-- One row per line of every file, header lines included. The unit separator
-- never occurs in a log line, so each line lands whole in one column; quote and
-- escape are off so a stray quote in a user agent cannot swallow the rest of the
-- file. chr() because DuckDB string literals do not process escapes.
--
-- Two patterns because a dump holds either .gz or .tsv, not both. Deduplicated
-- because with neither present both resolve to the same empty placeholder, and
-- read_csv handed the same empty file twice forgets the columns it was given.
SET VARIABLE cf_files = list_distinct(list_concat(
  source_files('../../dumps/cloudfront/**/*.gz'), source_files('../../dumps/cloudfront/**/*.tsv')));

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
  -- Hit, RefreshHit, Miss, LimitExceeded, CapacityExceeded, Error, Redirect, and
  -- FunctionGeneratedResponse where a CloudFront Function answered without an
  -- origin, as robots.txt is. Only the first two were answered from the edge.
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
  -- The PathPattern of the behavior that ANSWERED, `*` for the default one,
  -- which is not always the one the path matched: on the SPA distribution a
  -- path with no object behind it is answered by the error response, which
  -- fetches /index.html through the default behavior, so every client-side
  -- route logs `*` whatever it matched. Nothing under /api/ falls back that way.
  nullif(cf_field(cols, fields, 'cache-behavior-path-pattern'), '-') AS cache_behavior,
  cf_field(cols, fields, 'cs-protocol') AS scheme,
  cf_field(cols, fields, 'cs-protocol-version') AS http_version,
  nullif(cf_field(cols, fields, 'ssl-protocol'), '-') AS tls_version,
  nullif(cf_field(cols, fields, 'sc-content-type'), '-') AS content_type,
  cf_field(cols, fields, 'x-edge-request-id') AS request_id,
  source_file
FROM lines;

COMMENT ON TABLE cloudfront_requests IS 'GRAIN: one row per request at the CloudFront edge, both distributions, every environment pulled. Cache hits included: this is what clients got, not what reached S3. `is_probe` marks the project''s own probes; visitors and everything built on it leave them out, this relation does not. Columns a file predates are NULL.';

CREATE OR REPLACE VIEW cloudfront_checks AS
-- Every file declares its columns once. Zero headers means it is not a CloudFront
-- log; two means two deliveries were concatenated.
SELECT 'header_lines_not_one' AS check_name,
       source_file || ' has ' || header_lines || ' #Fields lines' AS detail
FROM cloudfront_files WHERE header_lines <> 1

UNION ALL
-- Every field the reader consumes that every file so far carries. The fields
-- CloudFront added on 2026-09-11 and 2026-09-13 are not here, which the older
-- files lack. A file missing one still loads with that column NULL, and a NULL
-- is silent: without x-edge-result-type the cache hit rate reads 0%, without
-- cs(Referer) return visits stop counting, without c-port every request looks
-- like its own connection. This is the only thing that says so.
SELECT 'missing_required_field',
       source_file || ' lacks ' || f.field
FROM cloudfront_files
CROSS JOIN (SELECT unnest([
  'date', 'time', 'x-edge-location', 'c-ip', 'c-port', 'cs-method', 'x-host-header', 'cs-uri-stem', 'cs-uri-query',
  'sc-status', 'cs(Referer)', 'cs(User-Agent)', 'x-edge-result-type', 'x-edge-detailed-result-type',
  'sc-bytes', 'cs-bytes', 'time-taken', 'time-to-first-byte', 'cs-protocol', 'cs-protocol-version',
  'ssl-protocol', 'sc-content-type', 'x-edge-request-id']) AS field) f
WHERE header_lines = 1 AND NOT list_contains(fields, f.field)

UNION ALL
-- A line whose column count disagrees with its header is dropped by the reader;
-- more than a stray one means the format moved under the tab split.
SELECT 'malformed_rows',
       source_file || ' has ' || malformed_rows || ' lines whose column count disagrees with its header'
FROM cloudfront_files WHERE malformed_rows > 0

UNION ALL
SELECT 'null_ts', count(*) || ' requests have an unparseable date or time'
FROM cloudfront_requests WHERE ts IS NULL
HAVING count(*) > 0

UNION ALL
-- Bounded against now() rather than a hardcoded date so it ages well.
SELECT 'ts_out_of_range',
       count(*) || ' requests fall outside 2020..now; date parsing may be wrong'
FROM cloudfront_requests WHERE ts < TIMESTAMP '2020-01-01' OR ts > now() + INTERVAL 1 DAY
HAVING count(*) > 0

UNION ALL
SELECT 'null_status', count(*) || ' requests have no status'
FROM cloudfront_requests WHERE status IS NULL
HAVING count(*) > 0

UNION ALL
-- How a directory the puller did not create announces itself.
SELECT 'unknown_distribution',
       'Directory ' || env || '/' || distribution || ' (' || count(*) || ' files) is not in distributions'
FROM cloudfront_files
WHERE distribution NOT IN (SELECT distribution FROM distributions)
GROUP BY env, distribution;

COMMENT ON VIEW cloudfront_checks IS 'Findings about the shape of the CloudFront logs; zero rows when healthy. Part of checks.';
