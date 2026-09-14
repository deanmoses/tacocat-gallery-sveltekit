-- API Gateway access logs: one record per request at the gallery API, api.*,
-- and the auth API, auth.*. This is the API's own tier, between CloudFront and
-- the Lambda; nothing sits in front of the auth API, so its client_ip and
-- user_agent are the browser's.
--
-- SOURCE: ../../dumps/cloudwatch/<stack>/<env>/api-access/YYYY-MM-DD.ndjson, one
-- filter-log-events event per line as the puller received it. The message is
-- flat JSON in the format each stack's template sets, every value quoted, `-`
-- where API Gateway had nothing to fill. The auth stack's twelve fields come
-- first in both; the gallery stack adds the Lambda request id, API Gateway's own
-- id, the epoch time and the route template. `requestId` is the id a client can
-- set, so `extended_request_id` is the one to key incident work on.
SET VARIABLE gateway_files = source_files('../../dumps/cloudwatch/*/*/api-access/*.ndjson');

CREATE OR REPLACE MACRO gw(record, key) AS nullif(record ->> key, '-');

CREATE OR REPLACE TABLE gateway_requests AS
WITH raw AS (
  SELECT
    regexp_extract(filename, 'dumps/cloudwatch/([^/]+)/([^/]+)/api-access/', 1) AS stack,
    regexp_extract(filename, 'dumps/cloudwatch/([^/]+)/([^/]+)/api-access/', 2) AS env,
    make_timestamp("timestamp" * 1000) AS logged_ts,
    try_cast(message AS JSON) AS record,
    message,
    eventId AS event_id,
    regexp_replace(filename, '^.*/dumps/cloudwatch/', '') AS source_file
  FROM read_json(getvariable('gateway_files'), format = 'newline_delimited', filename = true,
    columns = {'eventId': 'VARCHAR', 'timestamp': 'BIGINT', 'logStreamName': 'VARCHAR', 'message': 'VARCHAR'})
)
SELECT
  coalesce(
    make_timestamp(try_cast(gw(record, '$.requestTimeEpoch') AS BIGINT) * 1000),
    timezone('UTC', try_strptime(gw(record, '$.requestTime'), '%d/%b/%Y:%H:%M:%S %z'))
  ) AS ts,
  env,
  s.api,
  stack,
  gw(record, '$.requestId') AS request_id,
  gw(record, '$.extendedRequestId') AS extended_request_id,
  gw(record, '$.integrationRequestId') AS lambda_request_id,
  gw(record, '$.ip') AS client_ip,
  gw(record, '$.userAgent') AS user_agent,
  is_probe_ua(user_agent) AS is_probe,
  gw(record, '$.httpMethod') AS method,
  gw(record, '$.path') AS path,
  -- The route template, /album/{albumPath+}, which groups by endpoint.
  gw(record, '$.resourcePath') AS route,
  try_cast(gw(record, '$.status') AS INTEGER) AS status,
  try_cast(gw(record, '$.responseLength') AS BIGINT) AS response_bytes,
  -- The whole request as API Gateway saw it, then the Lambda's share of it; the
  -- difference is API Gateway's own.
  try_cast(gw(record, '$.responseLatency') AS INTEGER) AS latency_ms,
  try_cast(gw(record, '$.integrationStatus') AS INTEGER) AS integration_status,
  try_cast(gw(record, '$.integrationLatency') AS INTEGER) AS integration_latency_ms,
  gw(record, '$.errorMessage') AS error_message,
  logged_ts,
  message,
  event_id,
  source_file
FROM raw
LEFT JOIN api_stacks s USING (stack);

COMMENT ON TABLE gateway_requests IS 'GRAIN: one row per request at API Gateway, the gallery API and the auth API, every env pulled; the tier between CloudFront and the Lambda. `api` is gallery or auth. `is_probe` marks the synthetic API check. `lambda_request_id` joins to lambda_invocations where the stack logs it. `ts` is to the millisecond where the stack logs the epoch, else to the second. For the auth API, `path` is / with `status` 200 for a signed-in visit and 401 for anyone else.';

CREATE OR REPLACE VIEW gateway_checks AS
-- How a directory the puller did not create announces itself.
SELECT 'unknown_api_stack' AS check_name,
       'Directory ' || stack || '/' || env || '/api-access (' || count(*) || ' rows) is not in api_stacks' AS detail
FROM gateway_requests
WHERE api IS NULL
GROUP BY stack, env

UNION ALL
-- Every record names its time one way or the other; one that does not is a
-- format that moved under the reader.
SELECT 'gateway_null_ts', count(*) || ' access-log records have no parseable requestTime, e.g. ' || min(message)
FROM gateway_requests WHERE ts IS NULL
HAVING count(*) > 0

UNION ALL
SELECT 'gateway_null_status', count(*) || ' access-log records have no status, e.g. ' || min(message)
FROM gateway_requests WHERE status IS NULL
HAVING count(*) > 0;

COMMENT ON VIEW gateway_checks IS 'Findings about the shape of the API Gateway access logs; zero rows when healthy. Part of checks.';
