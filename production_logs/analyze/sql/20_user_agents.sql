-- The user-agent strings seen, parsed once each.
--
-- Parsing lives here rather than on cloudfront_requests because the same string
-- arrives thousands of times and its meaning never changes with the request.
-- Token order matters in every CASE: each Chromium browser also says Chrome and
-- Safari, and every WebKit browser says Safari, so the more specific tokens are
-- tested first.

CREATE OR REPLACE TABLE user_agents AS
WITH parsed AS (
  SELECT
    user_agent,
    CASE
      WHEN is_probe_ua(user_agent) THEN 'probe'
      WHEN is_bot_ua(user_agent) THEN 'bot'
      ELSE 'browser'
    END AS kind,
    CASE
      WHEN user_agent LIKE '%iPhone%' OR user_agent LIKE '%iPod%' THEN 'ios'
      WHEN user_agent LIKE '%iPad%' THEN 'ipados'
      WHEN user_agent LIKE '%Android%' THEN 'android'
      WHEN user_agent LIKE '%Macintosh%' OR user_agent LIKE '%Mac OS X%' THEN 'macos'
      WHEN user_agent LIKE '%Windows%' THEN 'windows'
      WHEN user_agent LIKE '%CrOS%' THEN 'chromeos'
      WHEN user_agent LIKE '%Linux%' OR user_agent LIKE '%X11%' THEN 'linux'
      ELSE 'other'
    END AS os,
    CASE
      WHEN regexp_matches(user_agent, 'Edg(iOS|A)?/') THEN 'edge'
      WHEN regexp_matches(user_agent, 'OP(R|iOS)/') THEN 'opera'
      WHEN user_agent LIKE '%SamsungBrowser/%' THEN 'samsung'
      WHEN regexp_matches(user_agent, '(Firefox|FxiOS)/') THEN 'firefox'
      WHEN regexp_matches(user_agent, '(Chrome|CriOS)/') THEN 'chrome'
      WHEN user_agent LIKE '%Version/%' AND user_agent LIKE '%Safari/%' THEN 'safari'
      ELSE 'other'
    END AS browser,
    CASE
      WHEN regexp_matches(user_agent, 'Edg(iOS|A)?/') THEN regexp_extract(user_agent, 'Edg(?:iOS|A)?/(\d+)(?:\.(\d+))?', ['major', 'minor'])
      WHEN regexp_matches(user_agent, 'OP(R|iOS)/') THEN regexp_extract(user_agent, 'OP(?:R|iOS)/(\d+)(?:\.(\d+))?', ['major', 'minor'])
      WHEN user_agent LIKE '%SamsungBrowser/%' THEN regexp_extract(user_agent, 'SamsungBrowser/(\d+)(?:\.(\d+))?', ['major', 'minor'])
      WHEN regexp_matches(user_agent, '(Firefox|FxiOS)/') THEN regexp_extract(user_agent, '(?:Firefox|FxiOS)/(\d+)(?:\.(\d+))?', ['major', 'minor'])
      WHEN regexp_matches(user_agent, '(Chrome|CriOS)/') THEN regexp_extract(user_agent, '(?:Chrome|CriOS)/(\d+)(?:\.(\d+))?', ['major', 'minor'])
      WHEN user_agent LIKE '%Version/%' THEN regexp_extract(user_agent, 'Version/(\d+)(?:\.(\d+))?', ['major', 'minor'])
    END AS bv,
    CASE
      WHEN user_agent LIKE '%iPhone%' OR user_agent LIKE '%iPad%' OR user_agent LIKE '%iPod%'
        THEN regexp_extract(user_agent, 'OS (\d+)[_.](\d+)', ['major', 'minor'])
      WHEN user_agent LIKE '%Android%' THEN regexp_extract(user_agent, 'Android (\d+)(?:\.(\d+))?', ['major', 'minor'])
      -- Frozen at 10.15.7 by every browser since 2021; kept because it is what the string says.
      WHEN user_agent LIKE '%Mac OS X%' THEN regexp_extract(user_agent, 'Mac OS X (\d+)[_.](\d+)', ['major', 'minor'])
      WHEN user_agent LIKE '%Windows NT%' THEN regexp_extract(user_agent, 'Windows NT (\d+)(?:\.(\d+))?', ['major', 'minor'])
    END AS ov
  FROM (SELECT DISTINCT user_agent FROM cloudfront_requests WHERE user_agent IS NOT NULL)
),
versioned AS (
  SELECT
    user_agent, kind, os, browser,
    try_cast(nullif(bv.major, '') AS INTEGER) AS browser_major,
    coalesce(try_cast(nullif(bv.minor, '') AS INTEGER), 0) AS browser_minor,
    try_cast(nullif(ov.major, '') AS INTEGER) AS os_major,
    coalesce(try_cast(nullif(ov.minor, '') AS INTEGER), 0) AS os_minor,
    -- On iOS and iPadOS the OS version decides, whatever the browser calls itself.
    CASE WHEN os IN ('ios', 'ipados') THEN 'ios' ELSE browser END AS platform
  FROM parsed
)
SELECT
  v.user_agent, v.kind, v.os, v.os_major, v.os_minor, v.browser, v.browser_major, v.browser_minor, v.platform,
  CASE
    WHEN v.kind <> 'browser' OR s.platform IS NULL THEN NULL
    WHEN v.platform = 'ios' THEN (v.os_major, v.os_minor) >= (s.min_major, s.min_minor)
    ELSE (v.browser_major, v.browser_minor) >= (s.min_major, s.min_minor)
  END AS avif_capable
FROM versioned v
LEFT JOIN avif_support s ON s.platform = v.platform;

COMMENT ON TABLE user_agents IS 'GRAIN: one row per distinct user-agent string in cloudfront_requests. `kind` is probe, bot or browser; `avif_capable` is NULL for anything that is not a browser and for browsers avif_support does not list. On iOS and iPadOS the OS version decides, so `platform` is ''ios'' there and the browser name elsewhere.';

CREATE OR REPLACE VIEW user_agent_checks AS
-- A browser whose version did not parse gets NULL for avif_capable and is
-- counted as unknown in avif_readiness. Thresholded because scanners send
-- browser-shaped junk; a real browser build appearing here is a regex to fix.
SELECT 'unversioned_browser' AS check_name,
       count(*) || ' browser agents have no parseable version, e.g. ' || min(user_agent) AS detail
FROM user_agents WHERE kind = 'browser' AND browser <> 'other' AND browser_major IS NULL
HAVING count(*) > 0;

COMMENT ON VIEW user_agent_checks IS 'Findings about user-agent parsing; zero rows when healthy. Part of checks.';
