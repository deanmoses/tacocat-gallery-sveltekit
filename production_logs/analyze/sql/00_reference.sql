-- Facts no log line states outright, and the user-agent vocabulary every later
-- file shares. Keep it small; prefer deriving over declaring.

-- The puller lays files out as dumps/cloudfront/<env>/<distribution>/, mirroring
-- the S3 prefixes, and the reader takes both from the path. This says what each
-- distribution serves; `unknown_distribution` names one that is not here.
CREATE OR REPLACE TABLE distributions (distribution VARCHAR, prod_hostname VARCHAR, role VARCHAR);
INSERT INTO distributions VALUES
  ('spa',   'pix.tacocat.com',     'index.html, the /_app/ build assets, and every album path the SPA routes client-side'),
  ('image', 'img.pix.tacocat.com', 'thumbnails and full-size images');

COMMENT ON TABLE distributions IS 'One row per CloudFront distribution the puller knows. Hand-maintained: a log file names its distribution only by the directory it was synced into.';

-- Grafana''s synthetic checks, which hit the SPA and the API every ten minutes
-- from three regions. Marked, never dropped: cloudfront_requests keeps them and
-- the views about people leave them out. `npm run perf` is not here: it drives
-- headless Chromium, which third-party scrapers do too, so it reads as a bot and
-- the machine running it as an operator.
CREATE OR REPLACE MACRO is_probe_ua(ua) AS
  coalesce(ua LIKE 'synthetic-monitoring-agent/%', false);

-- Agents that are not a person''s browser: crawlers that say so, headless
-- browsers, HTTP libraries, an absent agent, and the shapes vulnerability
-- scanners favour. The Claude desktop app is here because it browses the site
-- during development. "bot" has to be followed by punctuation: CUBOT is a phone.
CREATE OR REPLACE MACRO is_bot_ua(ua) AS
  ua IS NULL
  OR regexp_matches(ua, '(?i)bot[/;)\-,]') OR ua ILIKE '%crawl%' OR ua ILIKE '%spider%' OR ua ILIKE '%facebookexternalhit%'
  OR ua LIKE '%HeadlessChrome/%'
  OR ua LIKE 'curl/%' OR ua LIKE 'Wget/%' OR ua LIKE 'Java/%' OR ua LIKE 'Go-http-client%'
  OR ua ILIKE 'python%' OR ua = 'node' OR ua LIKE 'okhttp/%' OR ua LIKE 'axios/%'
  OR ua ILIKE '%Claude/%' OR ua ILIKE '%Electron/%'
  OR ua ILIKE '%NetworkingExtension%' OR ua ILIKE '%WebKit.Networking%'
  OR ua NOT LIKE 'Mozilla/%';

-- The project''s own machines announce themselves by running the perf script or
-- the Claude desktop app. An IP that did either, on any day in the dump, is an
-- operator throughout, whatever else it presented: the same household opens the
-- site in real browsers and on phones, and none of that is a visitor.
CREATE OR REPLACE MACRO is_operator_ua(ua) AS
  coalesce(ua LIKE '%HeadlessChrome/%' OR ua ILIKE '%Claude/%' OR ua ILIKE '%Electron/%', false);

-- The first release of each rendering platform that decodes AVIF, from caniuse
-- and the WebKit release notes. Keyed by PLATFORM rather than browser because on
-- iOS and iPadOS every browser is WebKit, so Chrome, Firefox and Edge there
-- decode whatever the OS version does; `user_agents` resolves those to the 'ios'
-- row on the OS version. A browser absent here reports NULL, not false.
--
-- Mac Safari decodes with the OS, and the user agent has said macOS 10.15.7 since
-- 2021, so the row has to hold on every macOS a version ships for: Safari 16
-- brought AVIF to Ventura only, 16.4 to Monterey and Big Sur as well.
CREATE OR REPLACE TABLE avif_support (platform VARCHAR, min_major INTEGER, min_minor INTEGER);
INSERT INTO avif_support VALUES
  ('ios',     16, 0),   -- iOS / iPadOS 16, September 2022
  ('safari',  16, 4),   -- every macOS Safari 16.4 runs on, March 2023
  ('chrome',  85, 0),
  ('edge',   121, 0),   -- Edge lagged Chromium here by three years
  ('firefox', 93, 0),
  ('opera',   71, 0),
  ('samsung', 14, 0);

COMMENT ON TABLE avif_support IS 'One row per rendering platform: the first version that decodes AVIF. Platform is the OS on iOS and iPadOS, the browser elsewhere.';
