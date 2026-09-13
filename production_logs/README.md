# Production logs

This is a DuckDB-based analytics system that pulls logs from the AWS for all Tacocat repos (CloudFront, Lambda) and Grafana's synthetic probes.

It exists to answer questions about our production systems:

- investigating incidents and errors
- understanding user and bot behavior
- helping improve performance
- understanding which browsers are users are on to determine a floor for browser support

```text
production_logs/
  dumps/cloudfront/<env>/<distribution>/   Raw CloudFront logs. Gitignored: they hold visitor IPs.
  dumps/grafana/synthetic/                 Raw Loki lines from the probes. Gitignored.
  dumps/lambda/<env>/                      One platform report per Lambda invocation. Gitignored.
  analyze/production_logs.duckdb           The log db. Derived, gitignored.
  analyze/sql/*.sql                        SQL that creates the log db.
```

```bash
# Acquire
npm run logs:pull                          # every source
npm run logs:pull:cloudfront               # prod, both distributions
production_logs/pull/cloudfront dev        # the staging twins
npm run logs:pull:grafana -- --start 2026-09-01   # the probes, that day through today
npm run logs:pull:lambda                   # prod Lambda reports; --env dev for staging

# Analyze
npm run logs -- "FROM avif_readiness;"   # one-shot
npm run logs                             # interactive session
production_logs/query --stale "..."      # query without rebuilding; says how old
production_logs/analyze/sql/build        # rebuild, gating on the checks
production_logs/analyze/test             # build against fixtures and assert
```

## Acquire

`pull/cloudfront` runs `aws s3 sync` from the two prod log buckets named in [Observability](../docs/Observability.md#cloudfront-access-logs) into `dumps/cloudfront/prod/spa/` and `dumps/cloudfront/prod/image/`. It only ever adds: CloudFront never rewrites a delivered file and nothing deletes, so the dump keeps what the buckets expire after 90 days. Needs the `aws` CLI with credentials for the Tacocat account.

`pull/grafana.ts` reads the synthetic-monitoring agent's lines out of Loki through the Grafana instance, one UTC day at a time, and merges them into `dumps/grafana/synthetic/<day>.ndjson` on timestamp and line, so a re-pull only adds. Needs `GRAFANA_ANALYTICS_TOKEN`, a service-account token with the Viewer role, in the environment or in the gitignored `.env` at the repo root. With no `--start` it resumes from the newest day on disk, or reaches back 14 days.

`pull/lambda.ts` runs `aws logs filter-log-events` over the stack's shared log group, `tacocat-gallery-sam/<env>`, one UTC day at a time, keeping the `platform.report` events and the `request_received` line with which `GenerateDerivedImage` names the image it resizes, and merges them into `dumps/lambda/<env>/<day>.ndjson` on the event id. Same credentials as `pull/cloudfront`. With no `--start` it resumes from the newest day on disk, or reaches back as far as the group keeps.

**Loki keeps 14 days.** CloudWatch keeps the Lambda reports 90 days in prod and 30 in dev, and the CloudFront buckets keep 90, so those tolerate being pulled late; the probes do not. `pull/all` runs the probes first for that reason.

**The newest day is always short.** CloudFront delivers a file ten minutes to a few hours after the requests in it, and Loki and CloudWatch are only as current as the last pull. Pull again before quoting today.

## Analyze

`query` rebuilds if the SQL or a dump is newer than the db, so the query is always current. Start from these:

| relation             | what it answers                                                                         |
| -------------------- | --------------------------------------------------------------------------------------- |
| `coverage`           | which days each source covers, and which are still arriving.                            |
| `summary`            | volume, cache hit rate and error rate per distribution.                                 |
| `avif_readiness`     | how many real visitors can decode AVIF. The answer to "can we drop the fallback".       |
| `browsers`           | those visitors by browser and OS version.                                               |
| `visitors`           | one row per IP, user agent and day, with what makes it a real visit or not.             |
| `probe_health`       | uptime and latency per day, check, target URL and probe region, as seen from outside.   |
| `probe_executions`   | one row per probe execution with every phase of the request timed.                      |
| `cold_starts`        | how often each function started cold, and what that cost, for probes and others.        |
| `lambda_invocations` | one row per Lambda invocation: init, duration, idle before it, whether a probe asked.   |
| `connections`        | one row per viewer connection, and whether API requests shared it with the page.        |
| `album_reads`        | one row per reader and album: how far they read, how fast, and how each image arrived.  |
| `image_delivery`     | per day and image kind, how many came from the edge, the bucket or Sharp, and how fast. |
| `image_requests`     | one row per derived-image request, parsed, with the resize behind a miss.               |

Every relation states its own grain and the wrong answer it prevents:

```sql
SELECT table_name AS rel, comment FROM duckdb_tables() WHERE internal = false
UNION ALL SELECT view_name, comment FROM duckdb_views() WHERE internal = false;
```

**Most rows are not people.** Over a quiet week the majority of requests are Grafana's synthetic checks, crawlers, vulnerability scanners presenting ten-year-old browser strings, and this project's own perf script and Claude desktop app. `cloudfront_requests` keeps all of them, marked; `visitors.is_visit` is the row that was a person, meaning a browser that loaded the app bundle and an image, or an image its own page referred, from an IP that never ran a development tool in the dump. The bundle is cached for a year, so a return visit fetches only thumbnails. Read `browsers` and `avif_readiness` for people, `summary` for the edge.

**`country` is NULL before 2026-09-11**, when CloudFront's field list changed and gained it; `whois` is the only way to place those visitors, and `coverage.has_country` says which days need it.

**`origin_ttfb_seconds`, `origin_seconds` and `cache_behavior` are NULL until the log delivery emits them.** They are the edge's wait on its origin and the behavior that answered: what separates CloudFront's share of an `/api/` request from the Lambda's. Until then `ts` is also only to the second, since `timestamp(ms)` is one of the same optional fields.

**A Next click leaves no request of its own.** The media page preloads the next and previous detail images, so what `album_reads` sees is the preload for the image after, spaced by how long the reader looked. Whether that preload finished before the click is something only the browser knows.

**The API handlers log nothing that says who asked.** `lambda_invocations.is_probe` recognises the synthetic API check by when it asked; everything else is people, crawlers and the admin together.

## Editing the analytics

See [analyze/sql/README.md](analyze/sql/README.md).
