-- Invariants. Each returns ZERO rows when healthy; any row is a finding.
--
-- These guard the SHAPE the layer assumes, and CloudFront''s shape is whatever the
-- delivery was last configured to emit: a field renamed or dropped in the console
-- shows up here as NULLs, never as an error, unless something says so.

CREATE OR REPLACE VIEW checks AS
-- Every file declares its columns once. Zero headers means it is not a CloudFront
-- log; two means two deliveries were concatenated.
SELECT 'header_lines_not_one' AS check_name,
       source_file || ' has ' || header_lines || ' #Fields lines' AS detail
FROM cloudfront_files WHERE header_lines <> 1

UNION ALL
-- Every field the reader consumes, except the two CloudFront added on 2026-09-11,
-- which the older files legitimately lack. A file missing one still loads with
-- that column NULL, and a NULL is silent: without x-edge-result-type the cache
-- hit rate reads 0%, without cs(Referer) return visits stop counting. This is
-- the only thing that says so.
SELECT 'missing_required_field',
       source_file || ' lacks ' || f.field
FROM cloudfront_files
CROSS JOIN (SELECT unnest([
  'date', 'time', 'x-edge-location', 'c-ip', 'cs-method', 'x-host-header', 'cs-uri-stem', 'cs-uri-query',
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
GROUP BY env, distribution

UNION ALL
-- A browser whose version did not parse gets NULL for avif_capable and is
-- counted as unknown in avif_readiness. Thresholded because scanners send
-- browser-shaped junk; a real browser build appearing here is a regex to fix.
SELECT 'unversioned_browser',
       count(*) || ' browser agents have no parseable version, e.g. ' || min(user_agent)
FROM user_agents WHERE kind = 'browser' AND browser <> 'other' AND browser_major IS NULL
HAVING count(*) > 0

UNION ALL
-- Every execution ends in a verdict line. One that does not was cut off, which a
-- pull landing mid-execution can do to the newest one; more than that means the
-- agent changed how it logs, or the puller dropped lines.
SELECT 'probe_execution_without_verdict',
       count(*) || ' executions have no Check succeeded/failed line'
FROM probe_executions
WHERE NOT has_verdict AND ts < (SELECT max(ts) - INTERVAL 5 MINUTE FROM probe_executions)
HAVING count(*) > 0

UNION ALL
-- A line without an execution id cannot be folded into an execution and is
-- dropped by the reader. The id is structured metadata, so this is what it looks
-- like when the puller stops carrying that field, or Loki stops sending it.
SELECT 'probe_line_without_execution_id',
       count(*) || ' probe lines carry no execution id and were dropped'
FROM probe_lines WHERE execution_id IS NULL
HAVING count(*) > 0

UNION ALL
-- A successful execution should say nothing but the routine lines every column
-- is keyed on. A new message on a success is the agent changing what it logs,
-- which is shape; on a failure it is the explanation, which probe_executions
-- carries as failure_reason and which fires nothing, because every failure has
-- its own words and a check that trips on each would soon be ignored.
SELECT 'probe_unknown_message',
       'Successful executions say msg="' || l.msg || '" (' || count(*) || ' lines), which the reader does not know'
FROM probe_lines l
JOIN probe_executions e USING (execution_id)
WHERE e.success AND NOT is_progress_msg(l.msg)
GROUP BY l.msg

UNION ALL
-- No VIEW may read the filesystem. A view over a file reader re-reads its files on
-- every query, resolved against the CALLER''s working directory, and `query` does
-- not cd. read_csv raises there, which is loud; glob returns an empty result, so a
-- view built on one reports nothing found, with no error, from every directory
-- but this one. Matched on the shape of a call, with the paren, so this branch
-- does not match its own text.
SELECT 'view_reads_filesystem',
       'View ' || view_name || ' reads the filesystem, so it resolves only from '
         || 'analyze/sql/ and is empty or failing everywhere else; make it a TABLE'
FROM duckdb_views()
WHERE internal = false
  AND regexp_matches(sql, '"?\bread_[a-z_]*"?\s*\(|"?\bglob"?\s*\(');

COMMENT ON VIEW checks IS 'Zero rows means healthy. Any row is a finding -- most often that the log delivery''s field list changed and a column has quietly gone NULL.';
