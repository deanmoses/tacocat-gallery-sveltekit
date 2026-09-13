-- What the dump covers, and how much of it is people.

-- READ THIS BEFORE QUOTING A COUNT. CloudFront delivers a file ten minutes to a
-- few hours after the requests in it, and Loki is only as current as the last
-- pull, so the newest day of any stream is short until the next one. `partial`
-- marks it. Days with no rows at all have no row here; on staging that is most
-- days.
CREATE OR REPLACE VIEW coverage AS
WITH cloudfront AS (
  SELECT
    'cloudfront' AS source,
    env || '/' || distribution AS stream,
    ts::DATE AS day,
    count(DISTINCT source_file) AS files,
    count(*) AS rows,
    min(ts) AS first_ts,
    max(ts) AS last_ts,
    bool_or(country IS NOT NULL) AS has_country
  FROM cloudfront_requests
  GROUP BY 1, 2, 3
),
grafana AS (
  SELECT 'grafana', check_name, ts::DATE, count(DISTINCT source_file), count(*), min(ts), max(ts), NULL
  FROM probe_executions
  GROUP BY 1, 2, 3
),
lambdas AS (
  SELECT 'lambda', env || '/' || function_name, ts::DATE, count(DISTINCT source_file), count(*), min(ts), max(ts), NULL
  FROM lambda_invocations
  GROUP BY 1, 2, 3
)
-- A stream's own last day, but only while it is within a day of the source's
-- newest: image logs lag the SPA's by hours, so image's last day is still
-- arriving when spa already has the next one, while a stream that stopped long
-- ago, such as a deleted check, is complete on its last day.
SELECT *, (day = max(day) OVER (PARTITION BY source, stream)
           AND day >= max(day) OVER (PARTITION BY source) - INTERVAL 1 DAY) AS partial
FROM (FROM cloudfront UNION ALL FROM grafana UNION ALL FROM lambdas)
ORDER BY source, stream, day;

COMMENT ON VIEW coverage IS 'GRAIN: one row per source, stream and UTC day with at least one row. A stream is an env/distribution at CloudFront, a check at Grafana, or an env/function at Lambda; `rows` are requests, executions and invocations respectively. `partial` is a stream''s last day while the source is still delivering, so it is still arriving. `has_country` is NULL before CloudFront added the field, and for Grafana. A day absent here had nothing, which on staging is normal.';

CREATE OR REPLACE VIEW summary AS
SELECT
  env, distribution,
  count(DISTINCT ts::DATE) AS days,
  count(*) AS requests,
  round(100.0 * count(*) FILTER (is_probe) / count(*), 1) AS pct_probe,
  count(DISTINCT client_ip) FILTER (NOT is_probe) AS client_ips,
  round(100.0 * count(*) FILTER (is_cache_hit) / count(*), 1) AS pct_cache_hit,
  round(100.0 * count(*) FILTER (status BETWEEN 400 AND 499) / count(*), 1) AS pct_4xx,
  round(100.0 * count(*) FILTER (status >= 500) / count(*), 1) AS pct_5xx,
  round(100.0 * count(*) FILTER (http_version = 'HTTP/3.0') / count(*), 1) AS pct_http3,
  min(ts) AS first_ts,
  max(ts) AS last_ts
FROM cloudfront_requests
GROUP BY env, distribution
ORDER BY env, distribution;

COMMENT ON VIEW summary IS 'GRAIN: one row per env and distribution over the whole dump. Volume and health at the edge, probes included in every column but client_ips. For people, read avif_readiness and browsers.';
