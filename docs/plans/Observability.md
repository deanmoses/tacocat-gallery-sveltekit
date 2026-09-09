# Observability

I want to get a handle on how Tacocat is running:

- Perf and caching and health of requests, including the AWS Cloudfront CDN
- Perf and errors and health of the AWS lambda and Dynamo DB back end
- Outages

The very first question I want to answer is what are the most effective ways of increasing the perceived end user performance of the site. For example, it's been years since we re-evaluated the CDN usage of this project, and I recently realized it's no longer best practice to have a separate domain for an app's static assets, which this project has done forever.

Then, when I do make changes based on this information, I want to be able to measure the results.

## Context

### The ecosystem

Tacocat is five moving parts across four repos plus one non-AWS service:

| Part            | Repo                                                  | Key AWS services                                                                    |
| --------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| SPA (this repo) | `tacocat-gallery-sveltekit`                           | — (build artifacts only)                                                            |
| SPA hosting     | `tacocat-gallery-hosting-aws`                         | S3, CloudFront (`pix.tacocat.com`)                                                  |
| Back end        | `tacocat-gallery-sam`                                 | Lambda, DynamoDB, API Gateway, S3, CloudFront (`img.pix.tacocat.com`), MediaConvert |
| Auth            | `tacocat-gallery-auth`                                | Cognito, Lambda                                                                     |
| Search          | none — configured by hand in the Redis Labs dashboard | —                                                                                   |

The AWS account is `010410881828`, everything in `us-east-1`.

## Requirements

Much of this stems from the fact that this a family photo website. There's one maintainer. It usually gets touched once a year, to update dependencies and modernize. It _is_ multi-generational, it has existed for 25 years already over various industry technology shifts, and we _do_ plan for it to be around for decades more.

1. **Push, not pull.** One person runs this and will not check a dashboard. Anything that depends on remembering to look at something has already failed. The system must email when something is wrong; every other surface exists only for when an investigation is already underway.
2. **Roughly $1–2/month.** Free where free is genuinely better, paid where paid is genuinely better, and no surprises.
3. **Few enough alarms to keep reading them.** A noisy channel gets filtered to a folder and the next incident is missed the same way this one was.
4. **Queryable by scripts and AI sessions.** The working pattern is read-only credentials plus small scripts that an AI session can run. Prefer one credential and one CLI over per-vendor API tokens.
5. **Defined as code, beside what it monitors.** Alarms belong in the same `template.yaml` as the resource, deployed by the same `sam deploy`, reviewed in the same PR. Monitoring that lives in a web console drifts.
6. **Durable for decades.** This is a family photo gallery, not a startup. A vendor billing $0.52/month is a safer long-term bet than one billing nothing. Baselime was good, got acquired, and was shut down.
7. **Answers must survive the answer.** Enabling logs is urgent in a way alarms are not: logs cannot be created retroactively, so every day they stay off is a day that can never be investigated.

## Everything below this is AI-generated

Everything below this is AI-generated and I do not vouch for it.

## Analysis

### How this was measured

Everything below comes from three sources, none of which required changing any infrastructure: `curl` against production, CloudWatch metrics and Lambda logs that were already being collected, and a headless browser driven by the Playwright that this repo already installs. That last one is now checked in as `scripts/measure-perf.mjs`.

### Traffic

Production is small. Over the seven days ending 2026-09-09: 9,758 requests to the SPA distribution, 6,909 to the image distribution, and 624 `GetAlbum` invocations — roughly 85 album views a day.

That number drives most of what follows. It means CDN log analysis has little signal, it means a fifth of Lambda invocations are cold, and it means per-event pricing is affordable.

### Where the time goes

Root album, median of five runs against production, warm:

| Segment                                         | Starts | Done   | Took  |
| ----------------------------------------------- | ------ | ------ | ----- |
| Shell (HTML, JS, CSS — 38 requests over HTTP/2) | 0ms    | 143ms  | 143ms |
| Album JSON                                      | 143ms  | 784ms  | 641ms |
| Thumbnails (65)                                 | 784ms  | 1174ms | 390ms |

LCP lands at ~884ms warm. The shell is not the problem; everything after it is waiting on the album JSON.

Breaking the 641ms album leg down further, using `curl` and the Lambda logs: roughly 130ms of DNS, TCP and TLS to a second origin, ~334ms of Lambda, and ~135ms of API Gateway plus transferring 28KB of uncompressed JSON.

### Cold starts

From the `platform.report` records in the `GetAlbum` log group over the same window:

```
invocations  624      coldStarts  129 (21%)
avgInitMs    318      maxInitMs   371      avgDurationMs  334
```

A fifth of visitors pay an extra ~318ms. Real, but a fifth the size of an early estimate made by comparing a cold browser run against a warm one — that gap also contained cold DNS, cold TLS and a cold edge.

### Findings

Ranked by measured contribution to a warm page load:

1. **Three origins instead of one.** `pix.`, `api.` and `img.` each cost a fresh DNS+TCP+TLS handshake, and because they are discovered in sequence — the API is not known until the JS boots, the images not until the API returns — each handshake sits squarely on the critical path rather than overlapping anything. Serving everything from one distribution with path-based behaviours removes two handshakes and lets the thumbnails reuse the HTTP/2 connection already open for the HTML. Domain sharding was an HTTP/1.1 workaround; under HTTP/2 it costs more than it saves.
2. **The image CDN negotiates HTTP/1.1.** `HttpVersion` is absent from the SAM template and CloudFormation defaults to `http1.1`. 65 thumbnails against a 6-connection-per-origin limit is ~390ms of the warm load. Consolidation makes this moot; setting `http2and3` fixes it independently.
3. **The API does not compress.** The root album is 28,135 bytes with or without `Accept-Encoding`. There is no explicit `AWS::Serverless::Api`, so `MinimumCompressionSize` is unset.
4. **`GetAlbum` runs at 256MB.** That is roughly 0.14 vCPU, and both init and execution are CPU-bound. More memory buys proportionally more CPU.
5. **Cold thumbnails take 3.6s.** Derived images are generated on demand through a CloudFront origin group that fails over from S3 to a Lambda function URL on 403/404. `GenerateDerivedImage` also runs at 256MB and averages 3,768ms. Only the first viewer of an uncached size pays it, which in practice means whoever opens a new album first.
6. **No `Cache-Control` on `index.html`.**

### The one thing we cannot currently see

`nextHopProtocol` and `transferSize` come back empty for the API and image origins, because neither sends a `Timing-Allow-Origin` header. Segment timings are unaffected, but per-resource protocol and byte counts are invisible to any browser-side measurement — including any real-user monitoring added later. It is a one-line response-header change and worth making before it is needed.

### What is watching production today

Nothing. One CloudWatch alarm exists, on `AWS/Lambda Errors`, for **dev**. There is an SNS topic wired to email, also dev-only. CloudFront access logs are disabled on all five distributions, no tracing is enabled anywhere, there are no canaries, no budget, and all 69 Lambda log groups are set to never expire.

The cost of that showed up in the 4xx rate on the production image distribution:

```
2026-09-02  31.9%
2026-09-03  67.9%
2026-09-04  56.5%
2026-09-05  16.1%
2026-09-06   1.8%
2026-09-07   3.8%
2026-09-08   1.4%
```

5xx held at 0.01% throughout, so these were client-facing 404/403s rather than back end failure. A three-day outage in which most image requests failed came and went unnoticed, and cannot be diagnosed now because no access logs were ever written.

## Proposal

### Measuring

`npm run perf` runs `scripts/measure-perf.mjs`: a headless browser against production, five runs, reporting the median of each critical-path segment. Run it before a change and after.

That is the entire measurement apparatus. It needs no AWS changes, no vendor, no budget, and it survives a year of neglect because it is a file in a repo rather than a configuration in a console.

Its value is not theoretical. Over the course of designing this document the ranking of performance fixes was revised twice, each time because a measurement contradicted a plausible-sounding argument — first that HTTP/2 on images was the biggest lever, then that cold starts cost 1,200ms.

### Performance fixes, in measured order

1. Consolidate the three domains behind one distribution. Largest win, and the only change that touches three of the six segments.
2. Compress the API response.
3. Raise `GetAlbum` memory to 1024MB. Cuts init and duration together; the bill is trivial at 624 invocations a week.
4. Raise `GenerateDerivedImage` memory, or pre-generate the standard thumbnail size during upload processing.
5. `Cache-Control` on `index.html`, and `Timing-Allow-Origin` on the API and image origins.

If consolidation is deferred, `HttpVersion: http2and3` on the image distribution and two `preconnect` hints in `app.html` recover part of the same ground — the preconnect hints measured at ~67ms.

### Outages

**One alarm: CloudFront `4xxErrorRate` on the production image distribution, above 10% for 15 minutes**, delivered to a production clone of the existing SNS topic.

That threshold comes from the data above: the baseline runs 1.4–3.8% and the September incident ran 32–68%, so 10% separates them with margin on both sides. It is the failure mode that has actually occurred here.

A second alarm on Lambda `Errors` was considered and dropped. It would not have caught September, and code defects surface through the integration tests that run on deploy.

### Housekeeping

Not observability, but cheap and adjacent: set retention on the 69 log groups (30 days for dev and test, 90 for production), and create one AWS Budget at a threshold that would be surprising. Enable CloudFront standard logging to S3 on the two production distributions with a 90-day lifecycle rule — delivery is free, storage is pennies, and logs cannot be created retroactively.

## Options

Grouped by the decision each set of alternatives was competing to answer.

### How to measure performance

| Option                             | Verdict                                                                                                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checked-in browser script (chosen) | Free, no infrastructure, reuses Playwright, versioned beside the code it measures. Answers "did that change help?" directly.                                                                                                  |
| CloudWatch RUM                     | ~$0.52/month and technically sound, but at 85 views a day it would take weeks to accumulate signal, and the fixes above are unambiguous enough not to need it. Revisit if a change lands whose effect is genuinely uncertain. |
| Cloudflare Web Analytics           | Free and one script tag, but a third-party script and a second vendor for data the script already provides. Best fallback if real-user data ever becomes necessary.                                                           |
| X-Ray                              | Would confirm what the Lambda logs already showed. The `platform.report` records carry init and duration for free.                                                                                                            |

### How to reduce cold starts

| Option                                    | Verdict                                                                                                                                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| More memory (chosen)                      | CPU scales with memory and init is CPU-bound. Principled, one line, trivial cost at this volume.                                                                                                    |
| Serving album JSON from S3 via CloudFront | Removes Lambda from the read path entirely — no cold start, no duration, edge-cached, and it lands on the same origin once the domains are consolidated. The most thorough answer; a larger change. |
| Scheduled keep-warm pings                 | Rejected. An anti-pattern that adds invocations, adds cost, and buys 318ms on a fifth of requests.                                                                                                  |
| Provisioned concurrency                   | Rejected on cost for a site at this traffic.                                                                                                                                                        |

### How to know it broke

| Option                                                         | Verdict                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One CloudFront 4xx alarm (chosen)                              | Matches the only incident this system has actually had, with a threshold derived from its own baseline.                                                                                                                                                                                                                           |
| Six alarms across CloudFront, Lambda, DynamoDB and API Gateway | Rejected against the requirement to keep reading them. A channel with false positives gets filtered to a folder, and the next incident is missed exactly as September was.                                                                                                                                                        |
| External uptime monitor                                        | Rejected. The argument for it was that availability cannot be measured from inside the thing that might be unavailable — true, but it only matters if the information would be acted on, and for an AWS-wide outage it would not. The residual case, a deploy that returns 200 while broken, is covered by the integration tests. |
| CloudWatch Synthetics                                          | Rejected before the above: same region as what it watches, and 100 free runs a month against the 730 an hourly check needs.                                                                                                                                                                                                       |
| GitHub Actions scheduled canary                                | Rejected: GitHub disables scheduled workflows after 60 days without a commit, and some of these repos change twice a year. It would stop silently.                                                                                                                                                                                |

### Where observability lives

| Option                                  | Verdict                                                                                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AWS, plus a script in the repo (chosen) | One credential and one CLI for scripts and AI sessions. Alarms live in the same `template.yaml` as the resource they watch.                                |
| Grafana Cloud                           | Generous free tier, but its CloudWatch data source bills per `GetMetricData` call, and its main draw is dashboards, which the first requirement rules out. |
| Axiom                                   | 500GB/month free ingest, aimed at a log volume this project does not have.                                                                                 |
| Honeycomb, Datadog, New Relic           | Built for systems far larger and busier than this one.                                                                                                     |

### How to get cache hit rate

| Option                           | Verdict                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ |
| Derive from access logs (chosen) | The `x-edge-result-type` field gives it once standard logging is on.     |
| CloudFront additional metrics    | ~$2.40 per distribution per month for a number the logs already contain. |

### Deferred

| Option                                   | Verdict                                                                                                                                                                                                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Latency alarms                           | No baseline existed when this was written. The script now provides one; revisit once a few months of before-and-after numbers exist.                                                                                                                                   |
| DuckDB over CloudFront logs              | The right tool for forensics and the wrong one for monitoring. Seven days of traffic is about 7,000 image rows, and CDN logs record status and cache disposition, never when the gallery actually painted. Worth building the first time an incident needs explaining. |
| Real-time logs, custom metric namespaces | Cost real money for a request volume that cannot justify them.                                                                                                                                                                                                         |
