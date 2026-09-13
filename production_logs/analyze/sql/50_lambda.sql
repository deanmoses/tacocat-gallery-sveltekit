-- Lambda invocations, from the platform report each one ends with and the line a
-- handler logs on arrival.
--
-- SOURCE: ../../dumps/cloudwatch/tacocat-gallery-sam/<env>/YYYY-MM-DD.ndjson, one
-- filter-log-events event per line as the puller received it, the whole log
-- group unfiltered. The message is Lambda''s own JSON: platform records, whose
-- `type` is platform.start, platform.report and so on, and the handlers'' own
-- lines, which Lambda''s JSON log format stamps with a `level` and wraps in
-- `message`: usually the object they logged, with an `event` naming it, which
-- has arrived both as an object and as itself serialised to a string, and
-- sometimes just a sentence. A report carries duration, billed duration, memory, and
-- `initDurationMs` only when the invocation had to start an execution
-- environment first. Every function in the stack logs to one group, so the
-- function is read from the stream name,
-- YYYY/MM/DD/<stack>-<function>[<version>]<instance id>.
--
-- The report is written when the invocation ends. Its start is that less the
-- init and the duration.
--
-- Who asked is on the request line every handler logs on arrival: for the API
-- handlers, whether an id_token cookie came with the request, which is the same
-- test the read handlers decide on and never a validated token; for the image
-- resizer, the CloudFront request id CloudFront sends every origin, which is the
-- `x-edge-request-id` of the CloudFront row that caused the resize. The API
-- handlers log the CloudFront id too, but it is absent until the API sits behind
-- the SPA distribution; until then the gateway row, joined on the Lambda
-- request id, says who asked, including whether it was the synthetic check.
SET VARIABLE lambda_files = source_files('../../dumps/cloudwatch/tacocat-gallery-sam/*/*.ndjson');

CREATE OR REPLACE TABLE lambda_events AS
WITH raw AS (
  SELECT
    regexp_extract(filename, 'dumps/cloudwatch/tacocat-gallery-sam/([^/]+)/', 1) AS env,
    make_timestamp("timestamp" * 1000) AS ts,
    logStreamName AS stream,
    CASE WHEN json_valid(message) THEN message::JSON END AS record,
    message,
    eventId AS event_id,
    regexp_replace(filename, '^.*/dumps/cloudwatch/', '') AS source_file
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
  -- A platform record, or a line a handler logged; NULL for a line that is
  -- neither, such as plain text from a function logging outside JSON.
  CASE WHEN record ->> '$.type' LIKE 'platform.%' THEN 'platform'
       WHEN record ->> '$.level' IS NOT NULL THEN 'app' END AS kind,
  -- NULL for a handler line that was a sentence rather than an event; `text`
  -- holds the sentence.
  coalesce(record ->> '$.type', logged ->> '$.event') AS event,
  record ->> '$.level' AS level,
  CASE WHEN logged IS NULL THEN record ->> '$.message' END AS text,
  coalesce(record ->> '$.record.requestId', record ->> '$.requestId') AS request_id,
  record,
  logged,
  stream,
  message,
  event_id,
  source_file
FROM unwrapped;

COMMENT ON TABLE lambda_events IS 'GRAIN: one row per line in the stack''s log group. `kind` is platform for Lambda''s own records and app for a handler''s, with `event` naming which: platform.report, request_received, unhandled_error. A line that is neither has NULL kind, and the checks say so. `level` is the handler''s, so the errors are `kind = ''app'' AND level = ''ERROR''`; a handler line that was a sentence rather than an event has NULL event and the sentence in `text`. Read lambda_invocations and lambda_requests for the shaped views.';

CREATE OR REPLACE TABLE lambda_requests AS
SELECT
  ts, env, function_name, request_id,
  logged ->> '$.method' AS method,
  logged ->> '$.path' AS path,
  logged ->> '$.cfRequestId' AS cf_request_id,
  try_cast(logged ->> '$.hasToken' AS BOOLEAN) AS has_token,
  event_id, source_file
FROM lambda_events
WHERE event = 'request_received';

COMMENT ON TABLE lambda_requests IS 'GRAIN: one row per request a handler logged on arrival, by Lambda request id. For a derived image, `path` is what CloudFront asked for after its rewrite: /i/<media path>/<version>/<size>, then /crop=<x,y,w,h> for a cropped one, and `cf_request_id` is the CloudFront row''s request_id. `has_token` is whether an API request carried an id_token cookie, valid or not; NULL for the resizer, which has no cookies.';

-- What a resize cost and what it was given. The request names only the output;
-- Sharp time scales with the original, which only this line states. A resize
-- whose output was too large for a Lambda URL to return sent CloudFront a 503
-- to retry, and the retry was served from the bucket the image had just been
-- saved to.
CREATE OR REPLACE TABLE lambda_resizes AS
SELECT
  r.ts,
  r.env,
  r.request_id,
  r.logged ->> '$.path' AS path,
  r.logged ->> '$.format' AS format,
  try_cast(r.logged ->> '$.bytes' AS BIGINT) AS bytes,
  try_cast(r.logged ->> '$.originalBytes' AS BIGINT) AS original_bytes,
  try_cast(r.logged ->> '$.sourceWidth' AS INTEGER) AS source_width,
  try_cast(r.logged ->> '$.sourceHeight' AS INTEGER) AS source_height,
  try_cast(r.logged ->> '$.loadMs' AS INTEGER) AS load_ms,
  try_cast(r.logged ->> '$.sharpMs' AS INTEGER) AS sharp_ms,
  try_cast(r.logged ->> '$.saveMs' AS INTEGER) AS save_ms,
  EXISTS (SELECT 1 FROM lambda_events t
          WHERE t.env = r.env AND t.request_id = r.request_id AND t.event = 'response_too_large') AS too_large,
  r.event_id, r.source_file
FROM lambda_events r
WHERE r.event = 'derived_image_generated';

COMMENT ON TABLE lambda_resizes IS 'GRAIN: one row per image GenerateDerivedImage resized, by Lambda request id: the output''s format and bytes, the original''s bytes and pixel size, and milliseconds spent reading the original, in Sharp, and saving to S3. `too_large` is a result over 5MB base64, which the Lambda URL cannot return: CloudFront got a 503 and retried from the bucket.';

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
    q.cf_request_id,
    q.has_token,
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
  WHERE e.event = 'platform.report'
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
  t.cf_request_id,
  t.has_token,
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
    SELECT 1 FROM gateway_requests g
    WHERE g.env = t.env AND g.lambda_request_id = t.request_id AND g.is_probe
  ) AS is_probe,
  t.stream, t.message, t.event_id, t.source_file
FROM timed t;

COMMENT ON TABLE lambda_invocations IS 'GRAIN: one row per Lambda invocation, every function in the stack, every env pulled. `is_cold` means it first waited `init_ms` for an execution environment. `started_ts` is reconstructed from the end and the two durations. `path`, `cf_request_id` and `has_token` are what the handler logged on arrival. `idle_seconds` is how long the function had gone without an invocation ending before this one started, across all its instances, and negative when they overlapped. `is_probe` is an invocation the synthetic API check asked for, by the gateway row that names it; false where the gateway log does not cover the day.';

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
-- Every line is a platform record or a handler''s event. One that is neither is
-- a function logging outside JSON, or a shape that moved under the reader.
SELECT 'lambda_unknown_event',
       count(*) || ' events are neither a platform record nor a handler''s event, e.g. ' || min(message)
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
-- The resizer logs the CloudFront request id on every request, which is what
-- ties a resize to the miss that caused it. A request line without one, after
-- the first that had one, is CloudFront no longer sending the header or the
-- handler no longer logging it.
SELECT 'lambda_resize_without_cf_id',
       count(*) || ' derived-image requests carry no cfRequestId, e.g. ' || min(path)
FROM lambda_requests
WHERE function_name = 'GenerateDerivedImage' AND cf_request_id IS NULL
  AND ts > (SELECT min(ts) FROM lambda_requests WHERE function_name = 'GenerateDerivedImage' AND cf_request_id IS NOT NULL)
HAVING count(*) > 0;

COMMENT ON VIEW lambda_checks IS 'Findings about the shape of the Lambda logs; zero rows when healthy. Part of checks.';
