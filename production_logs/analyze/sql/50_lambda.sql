-- Lambda invocations, from the platform report each one ends with and the line a
-- handler logs on arrival.
--
-- SOURCE: ../../dumps/lambda/<env>/YYYY-MM-DD.ndjson, one filter-log-events event
-- per line as the puller received it. The message is Lambda''s own JSON. A report
-- carries duration, billed duration, memory, and `initDurationMs` only when the
-- invocation had to start an execution environment first. A request line wraps
-- what the handler logged in `message`, which has arrived both as an object and
-- as that object serialised to a string. Every function in the stack logs to one
-- group, so the function is read from the stream name,
-- YYYY/MM/DD/<stack>-<function>[<version>]<instance id>.
--
-- The report is written when the invocation ends. Its start is that less the
-- init and the duration, which is close enough to line up with a probe: API
-- Gateway''s own few milliseconds are not in either.
--
-- The API handlers log nothing on a successful read, so an invocation cannot say
-- who asked. The synthetic API check can be recognised anyway, because it says
-- when it asked: an invocation that started while one of its executions was
-- waiting is the check''s.
SET VARIABLE lambda_files = source_files('../../dumps/lambda/*/*.ndjson');

-- The env whose Lambdas a probe target reaches, NULL for a target that reaches
-- none. The API is whatever answers at api.<site>/ or at <site>/api/.
CREATE OR REPLACE MACRO api_probe_env(target) AS
  CASE WHEN NOT regexp_matches(target, '^https://(api\.[^/]+|[^/]+/api)/') THEN NULL
       WHEN target LIKE '%staging-pix.tacocat.com/%' THEN 'dev'
       ELSE 'prod' END;

-- Whether an invocation started during a probe execution: from a second before the
-- agent began, for the two clocks, to a second after its verdict. An execution
-- cut off before one waited no longer than the check''s three-second timeout.
CREATE OR REPLACE MACRO started_during_probe(probe_ts, probe_duration_ms, started_ts) AS
  started_ts BETWEEN probe_ts - INTERVAL 1 SECOND
                 AND probe_ts + to_microseconds(((coalesce(probe_duration_ms, 3000) + 1000) * 1000)::BIGINT);

CREATE OR REPLACE TABLE lambda_events AS
WITH raw AS (
  SELECT
    regexp_extract(filename, 'dumps/lambda/([^/]+)/', 1) AS env,
    make_timestamp("timestamp" * 1000) AS ts,
    logStreamName AS stream,
    CASE WHEN json_valid(message) THEN message::JSON END AS record,
    message,
    eventId AS event_id,
    regexp_replace(filename, '^.*/dumps/lambda/', '') AS source_file
  FROM read_json(getvariable('lambda_files'), format = 'newline_delimited', filename = true,
    columns = {'eventId': 'VARCHAR', 'timestamp': 'BIGINT', 'logStreamName': 'VARCHAR', 'message': 'VARCHAR'})
),
unwrapped AS (
  SELECT *,
    CASE json_type(record -> '$.message')
      WHEN 'OBJECT' THEN record -> '$.message'
      WHEN 'VARCHAR' THEN CASE WHEN json_valid(record ->> '$.message') THEN (record ->> '$.message')::JSON END
    END AS logged
  FROM raw
)
SELECT
  ts,
  env,
  nullif(regexp_extract(stream, '^\d{4}/\d{2}/\d{2}/tacocat-gallery-sam-[a-z]+-([A-Za-z0-9]+)\[', 1), '') AS function_name,
  nullif(regexp_extract(stream, '\]([0-9a-f]+)$', 1), '') AS instance,
  CASE WHEN record ->> '$.type' = 'platform.report' THEN 'report'
       WHEN logged ->> '$.event' = 'request_received' THEN 'request' END AS kind,
  coalesce(record ->> '$.record.requestId', record ->> '$.requestId') AS request_id,
  record,
  logged,
  stream,
  message,
  event_id,
  source_file
FROM unwrapped;

COMMENT ON TABLE lambda_events IS 'GRAIN: one row per CloudWatch event pulled. `kind` is report or request; anything else is a line the reader does not know, and the checks say so. Read lambda_invocations and lambda_requests rather than this.';

CREATE OR REPLACE TABLE lambda_requests AS
SELECT ts, env, function_name, request_id, logged ->> '$.method' AS method, logged ->> '$.path' AS path, event_id, source_file
FROM lambda_events
WHERE kind = 'request';

COMMENT ON TABLE lambda_requests IS 'GRAIN: one row per request a handler logged on arrival, by Lambda request id. For a derived image, `path` is what CloudFront asked for after its rewrite: /i/<media path>/<version>/<size>, then /crop=<x,y,w,h> for a cropped one.';

CREATE OR REPLACE TABLE lambda_invocations AS
WITH reports AS (
  SELECT
    e.ts,
    e.env,
    e.function_name,
    e.instance,
    e.request_id,
    q.method,
    q.path,
    e.record ->> '$.record.status' AS status,
    e.record ->> '$.record.errorType' AS error_type,
    try_cast(e.record ->> '$.record.metrics.initDurationMs' AS DOUBLE) AS init_ms,
    try_cast(e.record ->> '$.record.metrics.durationMs' AS DOUBLE) AS duration_ms,
    -- Includes the init: Lambda bills it on every cold start.
    try_cast(e.record ->> '$.record.metrics.billedDurationMs' AS DOUBLE) AS billed_ms,
    try_cast(e.record ->> '$.record.metrics.memorySizeMB' AS INTEGER) AS memory_mb,
    try_cast(e.record ->> '$.record.metrics.maxMemoryUsedMB' AS INTEGER) AS max_memory_mb,
    e.stream, e.message, e.event_id, e.source_file
  FROM lambda_events e
  LEFT JOIN lambda_requests q ON q.env = e.env AND q.request_id = e.request_id
  WHERE e.kind = 'report'
),
timed AS (
  SELECT *,
    ts - to_microseconds(((coalesce(init_ms, 0) + coalesce(duration_ms, 0)) * 1000)::BIGINT) AS started_ts
  FROM reports
)
SELECT
  t.ts,
  t.started_ts,
  t.env,
  t.function_name,
  t.instance,
  t.request_id,
  t.method,
  t.path,
  t.status,
  t.error_type,
  t.init_ms IS NOT NULL AS is_cold,
  t.init_ms,
  t.duration_ms,
  t.billed_ms,
  t.memory_mb,
  t.max_memory_mb,
  epoch(t.started_ts - lag(t.ts) OVER (PARTITION BY t.env, t.function_name ORDER BY t.ts)) AS idle_seconds,
  EXISTS (
    SELECT 1 FROM probe_executions p
    WHERE api_probe_env(p.target) = t.env AND started_during_probe(p.ts, p.duration_ms, t.started_ts)
  ) AS is_probe,
  t.stream, t.message, t.event_id, t.source_file
FROM timed t;

COMMENT ON TABLE lambda_invocations IS 'GRAIN: one row per Lambda invocation, every function in the stack, every env pulled. `is_cold` means it first waited `init_ms` for an execution environment. `started_ts` is reconstructed from the end and the two durations. `path` is set where the handler logged its request. `idle_seconds` is how long the function had gone without an invocation ending before this one started, across all its instances, and negative when they overlapped. `is_probe` is an invocation that started while a synthetic API check was waiting, matched on time alone; for the API everything else is people, crawlers and the admin together, because its handlers log nothing that says who asked.';

CREATE OR REPLACE VIEW cold_starts AS
SELECT
  env,
  ts::DATE AS day,
  function_name,
  is_probe,
  count(*) AS invocations,
  count(*) FILTER (is_cold) AS cold,
  round(100.0 * count(*) FILTER (is_cold) / count(*), 1) AS pct_cold,
  round(median(init_ms)) AS median_init_ms,
  round(median(init_ms + duration_ms)) AS median_cold_ms,
  round(median(duration_ms) FILTER (NOT is_cold)) AS median_warm_ms,
  round(max(idle_seconds) FILTER (NOT is_cold)) AS max_warm_idle_s,
  round(median(idle_seconds) FILTER (is_cold)) AS median_cold_idle_s
FROM lambda_invocations
GROUP BY ALL
ORDER BY env, day, function_name, is_probe;

COMMENT ON VIEW cold_starts IS 'GRAIN: one row per env, UTC day, function and whether a synthetic check asked. `pct_cold` is the share of invocations that waited for an execution environment; `median_cold_ms` is that wait plus the work, `median_warm_ms` the work alone. `max_warm_idle_s` is the longest the function sat idle and still found an instance warm, a lower bound on how long Lambda keeps one; `median_cold_idle_s` is the idle a cold start typically followed. Probes are a row of their own because they arrive on a fixed schedule and visitors do not, so blending them describes neither.';

CREATE OR REPLACE VIEW lambda_checks AS
-- The function comes out of the stream name. A stream this cannot read is Lambda
-- or the stack naming streams differently, and its invocations belong to nobody.
SELECT 'lambda_unreadable_stream' AS check_name,
       count(*) || ' events come from streams like ' || min(stream) || ', which name no function the reader can find' AS detail
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
HAVING count(*) > 0;

COMMENT ON VIEW lambda_checks IS 'Findings about the shape of the Lambda logs and their match to the probes; zero rows when healthy. Part of checks.';
