-- People, reconstructed from requests.
--
-- The logs have no session id and the SPA makes no API request the CDN sees, so
-- a visitor is an IP with one user-agent string on one UTC day. Two people behind
-- one NAT with the same browser build collapse into one; one person whose browser
-- updated mid-day splits into two. Both are rare enough at this traffic to accept.

-- IPs that ran the perf script or the Claude desktop app at any point in the dump.
-- Not scoped to the day: a home IP holds for weeks, and the day the tool was not
-- run is the day the same laptop would otherwise pass as a visitor.
CREATE OR REPLACE VIEW operator_ips AS
SELECT DISTINCT env, client_ip
FROM cloudfront_requests
WHERE is_operator_ua(user_agent);

COMMENT ON VIEW operator_ips IS 'GRAIN: one row per env and IP that presented a development tool on any day in the dump. The project''s own machines, and everything else behind their router.';

-- Every visit asks the auth API whether it is signed in, and the answer is the
-- status: 200 with a user, 401 without. The auth API is its own gateway with
-- nothing in front of it, so its IP and user agent are the browser''s, the same
-- pair CloudFront logs.
CREATE OR REPLACE VIEW signed_in_agents AS
SELECT DISTINCT env, ts::DATE AS day, client_ip, user_agent
FROM gateway_requests
WHERE api = 'auth' AND path = '/' AND status = 200;

COMMENT ON VIEW signed_in_agents IS 'GRAIN: one row per env, UTC day, IP and user agent the auth API answered 200 to, meaning a signed-in session. Joined into visitors as `signed_in`.';

CREATE OR REPLACE VIEW visitors AS
SELECT
  r.env,
  r.ts::DATE AS day,
  r.client_ip,
  max(r.country) AS country,
  max(r.asn) AS asn,
  r.user_agent,
  u.kind, u.os, u.os_major, u.os_minor, u.browser, u.browser_major, u.browser_minor, u.avif_capable,
  count(*) AS requests,
  count(*) FILTER (r.distribution = 'spa' AND r.path LIKE '/_app/%') AS app_asset_requests,
  count(*) FILTER (r.distribution = 'image') AS image_requests,
  -- Thumbnails a page on the site asked for. The bundle is cached for a year, so
  -- a return visit before the next deploy fetches none of it, and a thumbnail
  -- carrying the site as referer is the trace such a visit leaves. A scraper
  -- walking image URLs sends no referer, and a hotlink names another site.
  -- Anchored: img.pix.tacocat.com is not the site.
  count(*) FILTER (r.distribution = 'image' AND regexp_matches(r.referer, '^https://(staging-)?pix\.tacocat\.com/')) AS site_image_requests,
  min(r.ts) AS first_seen,
  max(r.ts) AS last_seen,
  -- The album paths opened, so a visit can be told from a probe of the home page.
  string_agg(DISTINCT r.path, ' ' ORDER BY r.path)
    FILTER (r.distribution = 'spa' AND r.path NOT LIKE '/_app/%' AND r.path NOT LIKE '%.%') AS pages,
  (o.client_ip IS NOT NULL) AS is_operator,
  (s.client_ip IS NOT NULL) AS signed_in,
  -- A person using the gallery loads the app bundle and then some thumbnails, or
  -- on a return visit just the thumbnails, referred by the page. Scanners hit one
  -- URL with a browser-shaped agent and do neither.
  (u.kind = 'browser' AND o.client_ip IS NULL
     AND ((count(*) FILTER (r.distribution = 'spa' AND r.path LIKE '/_app/%') > 0
           AND count(*) FILTER (r.distribution = 'image') > 0)
          OR count(*) FILTER (r.distribution = 'image' AND regexp_matches(r.referer, '^https://(staging-)?pix\.tacocat\.com/')) > 0)) AS is_visit
FROM cloudfront_requests r
JOIN user_agents u USING (user_agent)
LEFT JOIN operator_ips o ON o.env = r.env AND o.client_ip = r.client_ip
LEFT JOIN signed_in_agents s
  ON s.env = r.env AND s.day = r.ts::DATE AND s.client_ip = r.client_ip AND s.user_agent = r.user_agent
WHERE NOT r.is_probe
GROUP BY r.env, r.ts::DATE, r.client_ip, r.user_agent, u.kind, u.os, u.os_major, u.os_minor,
         u.browser, u.browser_major, u.browser_minor, u.avif_capable, o.client_ip, s.client_ip;

COMMENT ON VIEW visitors IS 'GRAIN: one row per env, UTC day, client IP and user-agent string, probes excluded. `is_visit` is the row that was a person using the gallery: a browser that loaded the app bundle and an image, or an image its own page referred, from an IP that never ran a development tool. `signed_in` is a row the auth API answered 200 to that day, which is the admin; false where the auth log does not cover the day. A return visit with everything cached leaves no request at all and is invisible here. Everything else here is a scanner, a crawler or a one-hit curiosity.';

CREATE OR REPLACE VIEW browsers AS
SELECT
  env, browser, browser_major, os, os_major, avif_capable,
  count(DISTINCT (client_ip, user_agent)) AS visitors,
  count(*) AS visitor_days,
  sum(requests) AS requests,
  min(day) AS first_day,
  max(day) AS last_day
FROM visitors
WHERE is_visit
GROUP BY ALL
ORDER BY visitors DESC, requests DESC;

COMMENT ON VIEW browsers IS 'GRAIN: one row per browser major version and OS major version among real visits. `visitors` counts distinct IP and agent pairs across days, `visitor_days` counts each day they came back.';

CREATE OR REPLACE VIEW avif_readiness AS
WITH people AS (
  SELECT DISTINCT env, client_ip, user_agent, avif_capable FROM visitors WHERE is_visit
)
SELECT
  env,
  count(*) AS visitors,
  count(*) FILTER (avif_capable) AS avif_capable,
  count(*) FILTER (NOT avif_capable) AS not_capable,
  count(*) FILTER (avif_capable IS NULL) AS unknown,
  round(100.0 * count(*) FILTER (avif_capable) / count(*), 1) AS pct_capable,
  (SELECT min(day) FROM visitors v WHERE v.env = people.env AND is_visit) AS first_day,
  (SELECT max(day) FROM visitors v WHERE v.env = people.env AND is_visit) AS last_day
FROM people
GROUP BY env;

COMMENT ON VIEW avif_readiness IS 'GRAIN: one row per env. The answer to "can we serve AVIF without a fallback": real visitors that can and cannot decode it. `unknown` is a browser avif_support does not list; look at browsers to see which.';
