-- Images as the gallery requests them, and people reading an album one image at
-- a time.
--
-- The SPA asks for a derived image as /i/<media path>?version=<v>&size=<s>, plus
-- &crop=<x,y,w,h> for a cropped thumbnail. A CloudFront Function rewrites that to
-- /i/<media path>/<v>/<s>[/crop=<x,y,w,h>], and on a cache miss the image comes
-- from the derived-images bucket or, when the bucket has none yet, from
-- GenerateDerivedImage resizing the original with Sharp. CloudFront logs both as a
-- Miss. The Lambda logs the rewritten path on arrival, so a miss is a resize when
-- the Lambda was asked for that exact path while CloudFront was waiting.
--
-- The media page preloads the next and the previous detail image, so a Next click
-- is answered from the browser''s cache and the request it leaves is for the image
-- after. A reader moving forward leaves one detail request per image, spaced by how
-- long they looked; the first image opened arrives with its two neighbours.

-- CloudFront logs the second the edge finished, so a Lambda it asked started after
-- the edge began, give or take the second that truncation loses and a second of
-- clock between the two.
CREATE OR REPLACE MACRO resized_during(cf_ts, cf_seconds, started_ts) AS
  started_ts BETWEEN cf_ts - to_microseconds(((coalesce(cf_seconds, 0) + 2) * 1000000)::BIGINT)
                 AND cf_ts + INTERVAL 1 SECOND;

CREATE OR REPLACE VIEW image_requests AS
WITH parsed AS (
  SELECT
    r.*,
    nullif(regexp_extract(r.path, '^/i(/\d{4}/\d{2}-\d{2})/[^/]+$', 1), '') AS album_path,
    nullif(regexp_extract(r.path, '^/i(/\d{4}/\d{2}-\d{2}/[^/]+)$', 1), '') AS media_path,
    nullif(url_decode(regexp_extract(r.query, '(?:^|&)version=([^&]*)', 1)), '') AS version,
    nullif(url_decode(regexp_extract(r.query, '(?:^|&)size=([^&]*)', 1)), '') AS size,
    nullif(url_decode(regexp_extract(r.query, '(?:^|&)crop=([^&]*)', 1)), '') AS crop,
    regexp_matches(r.query, '(?:^|&)crop=') AS has_crop
  FROM cloudfront_requests r
  WHERE r.distribution = 'image' AND r.path LIKE '/i/%'
),
-- The rewrite as the CloudFront Function does it: a parameter present but empty
-- still gets its slash, so `size=` reaches the Lambda as a trailing one.
keyed AS (
  SELECT *,
    path || '/' || url_decode(regexp_extract(query, '(?:^|&)version=([^&]*)', 1))
         || '/' || url_decode(regexp_extract(query, '(?:^|&)size=([^&]*)', 1))
         || CASE WHEN has_crop THEN '/crop=' || coalesce(crop, '') ELSE '' END AS derived_path
  FROM parsed
),
resizes AS (
  SELECT
    k.request_id,
    arg_min(
      struct_pack(request_id := i.request_id, is_cold := i.is_cold, init_ms := i.init_ms, duration_ms := i.duration_ms),
      abs(epoch(i.started_ts - k.ts))
    ) AS resize
  FROM keyed k
  JOIN lambda_invocations i
    ON i.env = k.env AND i.path = k.derived_path AND resized_during(k.ts, k.seconds, i.started_ts)
  GROUP BY k.request_id
)
SELECT
  k.ts,
  k.env,
  k.client_ip,
  k.client_port,
  k.user_agent,
  k.edge_location,
  k.country,
  k.album_path,
  k.media_path,
  k.version,
  k.size,
  k.crop,
  CASE WHEN k.media_path IS NULL THEN 'other' ELSE coalesce(s.kind, 'other') END AS kind,
  k.status,
  k.result_type,
  CASE WHEN k.result_type = 'Redirect' THEN 'redirect'
       WHEN k.status >= 400 THEN 'error'
       WHEN k.is_cache_hit THEN 'edge'
       WHEN z.resize IS NOT NULL THEN 'resized'
       ELSE 'bucket' END AS served_by,
  z.resize.request_id AS resize_request_id,
  z.resize.is_cold AS resize_cold,
  z.resize.init_ms AS resize_init_ms,
  z.resize.duration_ms AS resize_ms,
  k.ttfb_seconds,
  k.seconds,
  k.origin_ttfb_seconds,
  k.bytes_sent,
  k.content_type,
  k.http_version,
  k.is_probe,
  coalesce(v.is_visit, false) AS is_visit,
  coalesce(v.is_operator, false) AS is_operator,
  k.request_id
FROM keyed k
LEFT JOIN image_sizes s ON s.size = k.size
LEFT JOIN resizes z ON z.request_id = k.request_id
LEFT JOIN visitors v
  ON v.env = k.env AND v.day = k.ts::DATE AND v.client_ip = k.client_ip AND v.user_agent = k.user_agent;

COMMENT ON VIEW image_requests IS 'GRAIN: one row per request for a derived image at the image CDN, probes and bots included and marked. `kind` is thumbnail, detail or other, from image_sizes. `served_by` is edge (a cache hit), bucket (a miss answered from the derived-images bucket in us-east-1), resized (a miss GenerateDerivedImage answered with Sharp, its invocation in the resize_ columns), error or redirect. Times are at the edge; the network between it and the reader is on top.';

CREATE OR REPLACE VIEW image_delivery AS
SELECT
  env,
  ts::DATE AS day,
  kind,
  served_by,
  count(*) AS requests,
  count(*) FILTER (is_visit) AS visit_requests,
  round(1000 * median(ttfb_seconds)) AS median_ttfb_ms,
  round(1000 * quantile_cont(ttfb_seconds, 0.9)) AS p90_ttfb_ms,
  round(median(bytes_sent) / 1024) AS median_kb,
  round(median(resize_init_ms)) AS median_resize_init_ms
FROM image_requests
WHERE NOT is_probe AND NOT is_operator
GROUP BY ALL
ORDER BY env, day, kind, served_by;

COMMENT ON VIEW image_delivery IS 'GRAIN: one row per env, UTC day, image kind and how it was served, leaving out probes and the project''s own machines. `visit_requests` is how many of them came from real visits; the rest are crawlers and the like. Times to first byte are at the edge.';

CREATE OR REPLACE VIEW album_reads AS
WITH detail AS (
  SELECT *,
    epoch(ts - lag(ts) OVER (PARTITION BY env, ts::DATE, client_ip, user_agent, album_path ORDER BY ts)) AS gap_s
  FROM image_requests
  WHERE kind = 'detail' AND NOT is_probe
),
grid AS (
  SELECT env, ts::DATE AS day, client_ip, user_agent, album_path, count(*) AS thumbnails
  FROM image_requests
  WHERE kind = 'thumbnail' AND NOT is_probe
  GROUP BY ALL
)
SELECT
  d.env,
  d.ts::DATE AS day,
  d.client_ip,
  d.user_agent,
  d.album_path,
  bool_or(d.is_visit) AS is_visit,
  bool_or(d.is_operator) AS is_operator,
  min(d.ts) AS first_ts,
  max(d.ts) AS last_ts,
  count(DISTINCT d.media_path) AS images,
  count(*) AS requests,
  count(*) FILTER (d.served_by = 'edge') AS from_edge,
  count(*) FILTER (d.served_by = 'bucket') AS from_bucket,
  count(*) FILTER (d.served_by = 'resized') AS resized,
  count(*) FILTER (d.served_by IN ('error', 'redirect')) AS failed,
  round(1000 * median(d.ttfb_seconds) FILTER (d.served_by = 'bucket')) AS median_bucket_ttfb_ms,
  round(1000 * median(d.ttfb_seconds) FILTER (d.served_by = 'resized')) AS median_resized_ttfb_ms,
  round(1000 * max(d.ttfb_seconds)) AS max_ttfb_ms,
  round(median(d.gap_s), 1) AS median_gap_s,
  coalesce(any_value(g.thumbnails), 0) AS thumbnails
FROM detail d
LEFT JOIN grid g
  ON g.env = d.env AND g.day = d.ts::DATE AND g.client_ip = d.client_ip
  AND g.user_agent IS NOT DISTINCT FROM d.user_agent AND g.album_path = d.album_path
GROUP BY d.env, d.ts::DATE, d.client_ip, d.user_agent, d.album_path
ORDER BY first_ts;

CREATE OR REPLACE VIEW image_checks AS
-- Resizes and CloudFront misses are matched on the rewritten path and on time. A
-- resize no request matches is that match failing: the rewrite changed shape, or
-- the clocks drifted apart. Only where the image logs cover it, and only a day
-- behind their newest request, since CloudFront delivers some files a day late.
-- Only for sizes the SPA asks for: a hand-typed size has been seen to start a
-- second resize a second after CloudFront logged its only request, which this
-- match cannot place and a reader does not cause.
SELECT 'image_resize_without_request' AS check_name,
       count(*) || ' derived-image invocations match no CloudFront request, e.g. ' || min(i.path) AS detail
FROM lambda_invocations i
WHERE i.path LIKE '/i/%'
  AND regexp_extract(i.path, '^/i/\d{4}/\d{2}-\d{2}/[^/]+/[^/]*/([^/]*)', 1) IN (SELECT size FROM image_sizes)
  AND i.ts > (SELECT min(ts) FROM cloudfront_requests c WHERE c.distribution = 'image' AND c.env = i.env)
  AND i.ts < (SELECT max(ts) - INTERVAL 1 DAY FROM cloudfront_requests c WHERE c.distribution = 'image' AND c.env = i.env)
  AND NOT EXISTS (SELECT 1 FROM image_requests r WHERE r.resize_request_id = i.request_id)
HAVING count(*) > 0;

COMMENT ON VIEW image_checks IS 'Findings about the match between image requests and resizes; zero rows when healthy. Part of checks.';

COMMENT ON VIEW album_reads IS 'GRAIN: one row per env, UTC day, client IP, user agent and album with a detail image requested, probes excluded. `images` is how far they read, counting the neighbours preloaded along the way; `median_gap_s` is the typical time between detail requests, which is the time spent on an image, except that the first one opened arrives with its neighbours. `from_edge`, `from_bucket` and `resized` count how the images reached the edge. `thumbnails` is the album grid the same reader loaded. Read the is_visit rows for people.';
