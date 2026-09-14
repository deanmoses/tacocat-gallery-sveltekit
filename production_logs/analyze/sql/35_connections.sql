-- Viewer connections, reconstructed from requests.
--
-- CloudFront logs no connection id outside mutual TLS, but it logs the client's
-- source port, and a connection is one browser at one IP and port talking to one
-- edge. Requests on the same tuple share a connection unless it sat idle long
-- enough for the port to have been closed and handed out again; five minutes is
-- that line. Within a page load the gaps are seconds, so the line only decides
-- when a reader who paused comes back on a new connection.

CREATE OR REPLACE VIEW connections AS
WITH marked AS (
  SELECT *,
    coalesce(ts - lag(ts) OVER tuple > INTERVAL 5 MINUTE, true) AS opens
  FROM cloudfront_requests
  WINDOW tuple AS (PARTITION BY env, distribution, edge_location, client_ip, client_port, user_agent ORDER BY ts)
),
numbered AS (
  SELECT *,
    sum(opens::INTEGER) OVER (PARTITION BY env, distribution, edge_location, client_ip, client_port, user_agent
                              ORDER BY ts ROWS UNBOUNDED PRECEDING) AS seq
  FROM marked
)
SELECT
  env,
  min(ts)::DATE AS day,
  distribution,
  edge_location,
  client_ip,
  client_port,
  seq,
  user_agent,
  bool_or(is_probe) AS is_probe,
  any_value(http_version) AS http_version,
  min(ts) AS first_ts,
  max(ts) AS last_ts,
  count(*) AS requests,
  count(*) FILTER (path LIKE '/api/%') AS api_requests,
  count(*) FILTER (NOT is_cache_hit) AS origin_requests
FROM numbered
GROUP BY env, distribution, edge_location, client_ip, client_port, seq, user_agent;

COMMENT ON VIEW connections IS 'GRAIN: one row per viewer connection to a CloudFront edge: env, distribution, edge, client IP and port, and user agent, split where that tuple sat idle more than five minutes; `seq` numbers the splits. `api_requests` counts requests under /api/, so a connection carrying those and the page''s own requests is one the API shared rather than opening its own. Join to visitors on env, day, client_ip and user_agent for people.';
