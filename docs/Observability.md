# Observability

To find out how Tacocat is doing:

- [`npm run perf`](#npm-run-perf): live perf of a particular staging or prod URL
- [Grafana](#grafana-cloud): uptime & perf monitoring from multiple geos. Retains data for 14 days.
- [AWS](#aws): production logs
- [Discord](#discord): receiving alerts, historical alerts

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

```bash
aws logs describe-log-groups --query 'logGroups[].logGroupName'
aws logs tail /aws/lambda/<function> --since 1h
```

Lambda logs carry `platform.report` records with init duration, execution duration and peak memory per invocation — enough to answer cold-start and latency questions without enabling tracing.

Known gaps:

- **CloudFront access logs are disabled on all five distributions.** Cache hit rate and per-request CDN forensics are unavailable, and cannot be reconstructed retroactively.
- **No tracing, no canaries, no budget.**
- **Most log groups have no retention set**, so old logs are present but nothing expires.
- **The only CloudWatch alarm is dev-only** and was created by hand in the console rather than in a template.

## Discord

Send alerts to the [Tacocat Discord server `#general`](https://discord.com/channels/1547715867851366460/1547715868379586582).

Prefer Discord to email because email gets clutter-y and Discord server is nice easy-to-look-at history.
