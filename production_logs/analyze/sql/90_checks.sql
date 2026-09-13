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
-- Every field the reader consumes that every file so far carries. The two
-- CloudFront added on 2026-09-11 are not here, which the older files lack, nor
-- those no delivery has been configured to emit. A file missing one still loads
-- with that column NULL, and a NULL is silent: without x-edge-result-type the
-- cache hit rate reads 0%, without cs(Referer) return visits stop counting,
-- without c-port every request looks like its own connection. This is the only
-- thing that says so.
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
-- The function comes out of the stream name. A stream this cannot read is Lambda
-- or the stack naming streams differently, and its invocations belong to nobody.
SELECT 'lambda_unreadable_stream',
       count(*) || ' events come from streams like ' || min(stream) || ', which name no function the reader can find'
FROM lambda_events WHERE function_name IS NULL
HAVING count(*) > 0

UNION ALL
-- The puller keeps platform reports and request lines. Anything else is a line
-- whose shape moved under the reader, or a filter that let more through.
SELECT 'lambda_unknown_event',
       count(*) || ' events are neither a platform report nor a request line, e.g. ' || min(message)
FROM lambda_events WHERE kind IS NULL
HAVING count(*) > 0

UNION ALL
-- Every platform.report carries a duration. One without is a record shape the
-- reader does not know.
SELECT 'lambda_report_without_duration',
       count(*) || ' reports have no record.metrics.durationMs, e.g. ' || min(message)
FROM lambda_invocations WHERE duration_ms IS NULL
HAVING count(*) > 0

UNION ALL
-- Resizes and CloudFront misses are matched on the rewritten path and on time. A
-- resize no request matches is that match failing: the rewrite changed shape, or
-- the clocks drifted apart. Only where the image logs cover it, and only a day
-- behind their newest request, since CloudFront delivers some files a day late.
-- Only for sizes the SPA asks for: a hand-typed size has been seen to start a
-- second resize a second after CloudFront logged its only request, which this
-- match cannot place and a reader does not cause.
SELECT 'image_resize_without_request',
       count(*) || ' derived-image invocations match no CloudFront request, e.g. ' || min(i.path)
FROM lambda_invocations i
WHERE i.path LIKE '/i/%'
  AND regexp_extract(i.path, '^/i/\d{4}/\d{2}-\d{2}/[^/]+/[^/]*/([^/]*)', 1) IN (SELECT size FROM image_sizes)
  AND i.ts > (SELECT min(ts) FROM cloudfront_requests c WHERE c.distribution = 'image' AND c.env = i.env)
  AND i.ts < (SELECT max(ts) - INTERVAL 1 DAY FROM cloudfront_requests c WHERE c.distribution = 'image' AND c.env = i.env)
  AND NOT EXISTS (SELECT 1 FROM image_requests r WHERE r.resize_request_id = i.request_id)
HAVING count(*) > 0

UNION ALL
-- API checks and invocations are matched on time alone, so a successful API check
-- that no invocation started during is the match failing: the two clocks drifted
-- apart, or the check stopped reaching a Lambda. Only where the Lambda dump covers
-- that env, since the sources are pulled separately.
SELECT 'api_probe_without_invocation',
       count(*) || ' successful API checks started no Lambda invocation, e.g. at ' || min(p.ts)
FROM probe_executions p
JOIN (SELECT env, min(ts) AS first_ts, max(ts) AS last_ts FROM lambda_invocations GROUP BY env) l
  ON l.env = api_probe_env(p.target) AND p.ts BETWEEN l.first_ts AND l.last_ts
WHERE p.success
  AND NOT EXISTS (SELECT 1 FROM lambda_invocations i
                  WHERE i.env = l.env AND started_during_probe(p.ts, p.duration_ms, i.started_ts))
HAVING count(*) > 0

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
