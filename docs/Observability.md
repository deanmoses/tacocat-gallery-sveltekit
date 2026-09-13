# Observability

To find out how Tacocat is doing:

- [`npm run perf`](#npm-run-perf): live perf of a particular staging or prod URL
- [Grafana](#grafana-cloud): uptime & perf monitoring from multiple geos. Retains data for 14 days.
- [AWS](#aws): production logs
- [Production logs](#production-logs): who visits, on what browser, from the CloudFront logs in DuckDB
- [Discord](#discord): receiving alerts, historical alerts

The projects, domains and environments named throughout are mapped in [Ecosystem](Ecosystem.md).

## Grafana Cloud

Instance: `tacocorp.grafana.net`. Use the Grafana MCP server. Humans start with the [Synthetic Monitoring dashboard](https://tacocorp.grafana.net/a/grafana-synthetic-monitoring-app/home?from=now-24h&to=now&timezone=browser&var-probe=$__all&var-Filters=&var-region=$__all&var-check_type=$__all).

Two synthetic checks run every 10 minutes from Northern California, Paris and Ohio:

| Check               | Target                               |
| ------------------- | ------------------------------------ |
| `Tacocat SPA`       | `https://pix.tacocat.com/`           |
| `Tacocat Album API` | `https://api.pix.tacocat.com/album/` |

Both verify HTTPS and compression — gzip for API, brotli for SPA.

We're on the free plan. Logs are only retained 14 days so after that the only record of uptime is [Discord](#discord).

### Alerting

Alerts go to the [Tacocat Discord server](#discord).

### Querying it

Datasources: `grafanacloud-prom` (metrics), `grafanacloud-logs` (Loki), `grafanacloud-usage` (billing).

```promql
probe_success                                  # 1 = up, per check per probe
probe_http_duration_seconds{phase="connect"}   # also: resolve, tls, processing, transfer
probe_duration_seconds                         # total, per probe
probe_http_content_length                      # compressed bytes on the wire
probe_http_uncompressed_body_length            # decoded payload size
probe_ssl_earliest_cert_expiry                 # subtract time() for seconds remaining
grafanacloud_org_sm_billable_check_executions  # against grafanacloud_org_sm_included_check_executions
```

### Reading these metrics without being misled

Four traps, each of which has already produced a wrong answer:

- **The scrape interval is not the check interval.** Metrics are scraped every ~2 minutes but the checks execute every 10, so the same measurement is republished several times with fresh timestamps. `count_over_time` and `timestamp()` therefore both overstate how much data exists. A real execution is a **change in value**, so range-query the metric and count distinct values.
- **`config_version` changes on every check edit**, and two versions briefly coexist during a save. Aggregate across it, and prefer ratios (`avg`) over counts (`sum`) in anything that needs to be stable.
- **The alert reads Loki, not Prometheus.** It counts `{source="synthetic-monitoring-agent", probe_success="0"}` log lines; Prometheus only supplies the per-check threshold. If log ingestion breaks, the alert goes quiet rather than failing loudly.
- **`blackbox_exporter` does not speak HTTP/3**, so `probe_http_version` reports 2 for `pix.` regardless of what CloudFront actually negotiates with browsers.

Single-request probes cannot see thumbnails, LCP, or connection reuse across a page load. Use the perf script for that.

## `npm run perf`

Report on perf of a particular URL on prod or staging:

```bash
npm run perf # hit https://pix.tacocat.com/ with 5 runs
npm run perf https://pix.tacocat.com/2022/11-27 7 # optional URL and run count
```

Drives headless Chromium and reports the median and spread of each critical-path segment across the runs after the first.

**The medians describe a warm visit, and most visits are not warm.** Even in prod, visits arrive too sparsely for that: roughly three quarters of `GetAlbum` invocations that follow an idle gap init from cold, at a cost of around 450ms. The first run is held out of the median for that reason — including it would let an "after" taken later in a session beat a "before" taken earlier whether or not anything improved — but it is reported on its own line, because it is what most visits get.

**The bundled Chromium ignores `<link rel="preconnect">`**, so this script cannot measure preconnect hints.

Run before and after a change and **believe a difference only when it is larger than the spread**.

## AWS

Account `010410881828`, everything `us-east-1`. Use the `aws` CLI.

### Logs

#### Lambda logs

Each AWS stack in the `tacocat-gallery-sam` project writes every Lambda's logs to one shared log group, `tacocat-gallery-sam/<env>`, with streams named after the function. Retention is 90 days in prod and 30 in dev and test.

```bash
aws logs tail tacocat-gallery-sam/prod --since 1h
aws logs tail tacocat-gallery-sam/prod --since 1h --filter-pattern '{ $.event = "server_exception" }'
```

These logs carry `platform.report` records with init duration, execution duration and peak memory per invocation — enough to answer cold-start and latency questions without enabling tracing. Every API handler logs a `request_received` line on arrival with the method, path, whether an `id_token` cookie came along, and the CloudFront request id once the API sits behind the SPA distribution; `GenerateDerivedImage` logs the CloudFront id on every request and a `derived_image_generated` line with what the resize cost.

#### API Gateway access logs

Both API Gateways log one JSON record per request to their own group, `tacocat-gallery-sam/<env>/api-access` and `tacocat-gallery-auth/<env>/api-access`, with the same retention as the Lambda groups: method, path, status, latency split into API Gateway's and the Lambda's share, client IP, user agent and error message. The gallery API's record also carries the Lambda request id, API Gateway's own request id, the epoch time in milliseconds and the route template. The auth log's `path` omits the query string, so the OAuth `code` and `state` on the login callback never reach it; keep it that way.

```bash
aws logs tail tacocat-gallery-sam/prod/api-access --since 1h
```

#### CloudFront access logs

Two distributions write access logs to S3, tab-separated with a `#Fields` header, expiring after 90 days. The `x-edge-result-type` field gives cache hit rate. Delivery lags requests by ten minutes to a few hours.

| Distribution                   | Bucket                                                 | Prefix                                              |
| ------------------------------ | ------------------------------------------------------ | --------------------------------------------------- |
| Images (`img.pix.tacocat.com`) | `tacocat-gallery-sam-prod-cloudfront-logs`             | `AWSLogs/010410881828/CloudFront/image/YYYY/MM/DD/` |
| SPA (`pix.tacocat.com`)        | `tacocat-gallery-website-hosting-prod-cloudfront-logs` | `AWSLogs/010410881828/CloudFront/spa/YYYY/MM/DD/`   |

Staging twins write to the matching `-dev` buckets. The SPA distribution is defined in the `tacocat-gallery-hosting-aws` repo.

**The field list has changed twice.** On 2026-09-11 the cookie, forwarded-for and range columns went and `asn` and `c-country` came; on 2026-09-13 `timestamp(ms)`, `origin-fbl`, `origin-lbl` and `cache-behavior-path-pattern` were appended. Read the `#Fields` line of each file rather than assuming an order. `cache-behavior-path-pattern` is the behavior that answered, so on the SPA distribution every client-side route logs `*`: the error response fetches `/index.html` through the default behavior.

Delivery is configured through CloudWatch, not on the distribution, so `get-distribution-config` shows logging disabled while logs are flowing. `aws logs describe-delivery-sources` is what says whether a distribution is logging.

```bash
aws s3 ls s3://tacocat-gallery-website-hosting-prod-cloudfront-logs/AWSLogs/010410881828/CloudFront/spa/ --recursive | tail
```

### Alarms

Defined in the `tacocat-gallery-sam` project's `template.yaml`. All publish to the `tacocat-gallery-sam-<env>-alerts` SNS topic, which emails Moses. The email body is the alarm's description, which says what broke and what to do.

| Alarm                             | Envs      | Fires when                                                                                                                                                  |
| --------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `image-cdn-4xx`                   | prod      | More than 25% of image CDN requests were 4xx in an hour that had more than 200 requests. The volume gate exists because most quiet hours hold 1–3 requests. |
| `api-5xx`                         | prod, dev | Any 5xx returned by the API in a five-minute window. Zero is the expectation.                                                                               |
| `ProcessMediaUpload-errors`       | prod, dev | The upload processor threw. Counts a failed first attempt even if the retry succeeded.                                                                      |
| `VideoTranscodingComplete-errors` | prod, dev | The MediaConvert completion handler threw.                                                                                                                  |
| `DynamoToRedis-errors`            | prod, dev | The Redis sync threw. After three retries the records are dropped; run `SyncRedis` to reconcile.                                                            |

These use exactly the ten alarm metrics in CloudWatch's always-free tier (the CDN alarm counts two), so any new alarm costs ten cents a month.

An AWS Budget emails Moses directly if the whole account's monthly bill passes $15.

```bash
aws cloudwatch describe-alarms --alarm-name-prefix tacocat-gallery-sam-prod
aws cloudwatch describe-alarm-history --alarm-name tacocat-gallery-sam-prod-api-5xx
```

To prove the chain end to end without touching data, invoke `tacocat-gallery-sam-<env>-DynamoToRedis` with `{"Records":[{"eventName":"REMOVE","dynamodb":{"Keys":{}}}]}`: it throws before reaching Redis, the errors alarm fires within about six minutes, and the email arrives.

### Gaps

- **No tracing, no canaries.** Grafana's synthetic checks cover uptime from outside.
- **Nothing from the browser.** No beacon or client-side telemetry, on purpose; whether a preloaded image was ready when a reader clicked Next is something no server log can say.

## Production logs

`production_logs/` pulls the CloudFront access logs above, the [synthetic probes'](#grafana-cloud) Loki lines, the [Lambda log group](#lambda-logs) and the [API Gateway access logs](#api-gateway-access-logs) into a local DuckDB. It answers questions about people rather than requests, which browsers visit, from where, whether they can decode a given image format and whether they were signed in; keeps the probes' per-execution timings past Loki's 14 days; says how often a request waited for a cold Lambda, with the probes' own invocations told apart from everyone else's; and ties each resized image to the request that caused it and what the resize cost. [Its README](../production_logs/README.md) has the relations to start from.

```bash
npm run logs:pull                          # sync every source into production_logs/dumps/ (gitignored)
npm run logs -- "FROM avif_readiness;"     # rebuilds if stale, then queries
npm run logs -- "FROM probe_health;"       # uptime and latency per day, check, target and probe
npm run logs -- "FROM cold_starts;"        # cold start rate and cost per day and function
```

The Grafana pull needs `GRAFANA_ANALYTICS_TOKEN` in the gitignored `.env`: a service-account token with the Viewer role.

Most requests are not people: Grafana's probes, crawlers, scanners and this project's own perf script and Claude desktop app dominate a quiet week. `visitors.is_visit` is the row that was a person.

## Discord

Send alerts to the [Tacocat Discord server `#general`](https://discord.com/channels/1547715867851366460/1547715868379586582).

Prefer Discord to email because email gets clutter-y and Discord server is nice easy-to-look-at history.

AWS is the exception: its CloudWatch alarms and the budget email Moses directly, because reaching Discord from AWS needs a relay Lambda and a webhook secret, which is more to maintain than the alerts are worth. Grafana alerts go to Discord.
