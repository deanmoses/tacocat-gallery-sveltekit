# Grafana Cloud, as it was configured

The synthetic checks, alert rule and Discord alerting that watched the AWS site were set up by hand in `tacocorp.grafana.net`, so these files are their record. They were exported on 2026-10-03 with a Viewer service-account token, after the gallery had moved to Cloudflare.

| File                         | What it is                                                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sm_check_info.json`         | The two HTTP checks as Prometheus reports them: `Tacocat SPA` on `https://pix.tacocat.com/` and `Tacocat Album API` on `https://api.pix.tacocat.com/album/`, every 600 seconds, from the `NorthCalifornia`, `Ohio` and `Paris` probes |
| `alert-rules.json`           | The one rule that was not a Grafana built-in: `ProbeFailedExecutionsTooHigh`, over a ten-minute window, in the Synthetic Monitoring folder                                                                                            |
| `contact-points.json`        | The `Tacocat Discord` contact point; Grafana redacts the webhook URL in its export                                                                                                                                                    |
| `notification-policies.json` | The routing policy: everything to that contact point, grouped by folder and alert name, with a 30 s group wait, 5 m group interval and 4 h repeat                                                                                     |

The checks' own settings beyond what the metrics carry, which is the HTTPS and compression-header assertions that [Observability.md](../../Observability.md) describes, are held by the Synthetic Monitoring app and need its own access token to export, which a Viewer token does not have. The 14 days of probe results Grafana kept are gone; what the DuckDB analytics pulled from them is the only longer record.
