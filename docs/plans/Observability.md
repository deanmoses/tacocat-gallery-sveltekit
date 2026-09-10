# Observability

**Update**: we've built these o11y tools based on this doc: [docs/Observability.md](../Observability.md).

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

The script holds its first run out of the median and prints the spread behind every median, both of which it earned the hard way. Three back-to-back invocations drifted downwards on every metric — LCP 736ms, then 688ms, then 668ms — because repeated runs keep the edge cache warm that 85 views a day let go cold. Without the warm-up discard, an "after" measured later in a session beats a "before" measured earlier whether or not anything improved. And the spread separates what the tool can prove from what it cannot: across those same invocations the album and thumbnail segments held to within 24ms and 8ms, while LCP moved by 68ms — wider than several of the wins being attributed to it.

Holding the first run out is right for comparing a before against an after and wrong as a description of a visit, and the two were conflated here for a while: every median in this document is what the second-through-sixth arrival in a burst sees. The script now reports that first run on its own line rather than discarding it. A genuinely idle first run against production on 2026-09-10 came in +174ms on the album leg and +240ms on LCP against the medians taken moments later — and the `GetAlbum` log confirms it as a cold start, 168ms of execution behind 289ms of init.

### Traffic

Production is small. Over the seven days ending 2026-09-09: 9,758 requests to the SPA distribution, 6,909 to the image distribution, and 624 `GetAlbum` invocations — roughly 85 album views a day.

That number drives most of what follows. It means CDN log analysis has little signal, it means per-event pricing is affordable, and — measured below rather than guessed — it means most arrivals meet a Lambda that has already been recycled.

### Where the time goes

Root album, median of five runs against production after a discarded warm-up, 2026-09-10:

| Segment                                                | Starts | Done  | Took  | Spread of "done" |
| ------------------------------------------------------ | ------ | ----- | ----- | ---------------- |
| Shell (HTML, JS, CSS — 37 requests over HTTP/2 and /3) | 0ms    | 122ms | 122ms | 102–147ms        |
| Album JSON                                             | 122ms  | 463ms | 341ms | 446–483ms        |
| Thumbnails on screen (16 of 65)                        | 463ms  | 628ms | 165ms | 596–721ms        |

LCP lands at 568ms (548–668).

Breaking the album leg down further with `curl`: roughly 155ms of DNS, TCP and TLS to a second origin, then the API's own time. Now that `GetAlbum` executes in a median of 22ms, that handshake is the largest single item left in the leg, and the case for consolidating the origins has nothing competing with it any more.

The thumbnail segment counts only the thumbnails inside the opening viewport, which is why it cannot be compared against figures recorded before 2026-09-10. Timing all 65 made the number depend on how many the album happens to have below the fold, and would have collapsed on its own the first time the grid loaded offscreen images lazily — a large apparent win with nothing having got faster for the person looking at the page.

### Cold starts

**The 5% cold-start rate this section used to report was the measuring script's rate, not production's.** It came from 37 `platform.report` records taken just after a deploy, in a window the perf script had itself filled with back-to-back invocations. Every one of those inherited a warm environment from the run a few seconds ahead of it. Widening the sample to the whole prod `GetAlbum` log group — 2,360 records, 2026-08-28 to 2026-09-10 — gives a different answer, and its shape is the finding.

Cold-start rate is a function of what came just before, and nothing else:

| Idle before the invocation | n     | cold      |
| -------------------------- | ----- | --------- |
| 0–10s                      | 1,579 | 5.4%      |
| 10–60s                     | 380   | 2.1%      |
| 60–120s                    | 96    | 9.4%      |
| 120–240s                   | 61    | 4.9%      |
| 240–480s                   | 48    | 37.5%     |
| ≥480s                      | 195   | **98.5%** |

So any raw rate is really a statement about how bursty the sample was. The number that describes a visitor is the rate for the **first** invocation after an idle gap, and it is stable however the bursts are cut:

| Sample                                               | n     | cold    |
| ---------------------------------------------------- | ----- | ------- |
| Every invocation                                     | 2,360 | 13.4%   |
| First invocation after ≥120s idle                    | 305   | **70%** |
| ... restricted to bursts of six or fewer             | 213   | 74%     |
| Lone invocations with nothing within 120s either way | 84    | 74%     |

**Roughly three quarters of arrivals are cold.** At 1024MB on arm64 the price is a median 309ms of init plus a 168ms cold execution against a 23ms warm median — about **455ms**, paid by most visitors. Both halves count; quoting init alone understates it by more than a third.

That reorders the whole document. The ~155ms API handshake is ranked below as the largest remaining item in the album leg, and it is the largest _warm_ one. Weighted by who actually pays it, the cold start is three times larger.

These are Lambda arrivals, not verified humans: a crawler and a person look the same here, and a few of the 305 leaders are perf-script runs. The rate is not sensitive to that — 305 leaders over 14 days is ~22 a day, and the script does not run that often.

**Init did not move**, and it is worth stating plainly rather than as a suspicion. It was ~330ms at 256MB on x86 with source maps and is ~322ms at 1024MB on arm64 with a bundle a quarter of the size (614KB to 162KB). Across both environments:

| Sample      | n   | avg init | p50   | p90   |
| ----------- | --- | -------- | ----- | ----- |
| dev before  | 50  | 314ms    |       |       |
| dev after   | 64  | 296ms    | 303ms | 319ms |
| prod before | 142 | 321ms    |       |       |
| prod after  | 2   | 322ms    |       |       |

Six percent in dev, nothing in prod. Init is dominated by sandbox and runtime bootstrap, which neither more CPU nor a smaller zip touches, and the answer does not wobble across two environments and two collection methods. This falsified the prediction that init and execution were both CPU-bound: init is not CPU-bound at all, and execution turned out to be bound by the DynamoDB connection timings below.

### Findings still open

Ranked by measured contribution to a page load, weighted by how many visits actually pay each one:

1. **Most visits wait ~455ms for a Lambda that has been recycled.** Three quarters of `GetAlbum` arrivals init from cold — see _Cold starts_, where the 5% figure that made this a non-issue turns out to have been the measuring script's own rate. It is the largest single item on the page for the visitor who meets it, and most visitors do. The fixes are not the ones ranked below it: a two-minute keep-warm ping, or moving album reads off Lambda entirely.

2. **Four origins, and the expensive one is not behind a CDN.** A page load touches `pix.`, `api.`, `img.` and `auth.`, each costing its own DNS, TCP and TLS. They are not equal:

    | Origin                             | TLS complete, 5 runs |
    | ---------------------------------- | -------------------- |
    | `pix.tacocat.com` (CloudFront)     | 42–61ms              |
    | `img.pix.tacocat.com` (CloudFront) | 43–78ms              |
    | **`api.pix.tacocat.com`**          | **152–160ms**        |

    `api.` and `auth.` are **REGIONAL** API Gateway custom domains, so their TLS terminates in us-east-1 rather than at an edge. Every visitor pays a transcontinental round trip for a connection the other two get locally. With `GetAlbum` now executing in 22ms, that ~155ms handshake is the largest single item left in the page load.

    The usual argument for consolidating — that domain sharding is an obsolete HTTP/1.1 workaround — is true but does no work here. These are not shards of one asset class; they are functionally distinct origins, and serving an API from its own hostname is a defensible architecture. The case rests on the measurement above, not on the principle.

3. **Thumbnails are JPEG, and far heavier than their size suggests.** A 200x200 thumbnail costs 18–30KB. A day album of 32 of them is 709KB of image transfer, and Lighthouse puts ~460KB of that as recoverable by encoding WebP or AVIF instead. Measured against production on a phone the figures are larger: `/2022/11-27` transfers 1.26MB of thumbnails, 622KiB of it recoverable, which is 94% of the whole page. That is larger than every latency win recorded in this document combined, and it is a change to `GenerateDerivedImage` rather than to the front end. Serving a modern format also has to survive browsers that cannot read it, so it needs either content negotiation on `Accept` at the edge or a `<picture>` element with a JPEG fallback — neither of which exists today.

4. **Every thumbnail loads eagerly.** At 1440x900 the root album puts 16 of its 65 thumbnails on screen and fetches all 65 — roughly 560KB nobody looks at, contending with the ones they do. On a 412x823 phone viewport the ratio is starker still: three thumbnails visible, 47 fetched. `Thumbnail.svelte` sets `decoding="async"` but neither `loading` nor `fetchpriority`.

    It is not quite the one free attribute it was first written up as. The LCP element on a day album **is** the first thumbnail, and Lighthouse fails any page whose LCP resource carries `loading="lazy"`. So the attribute has to apply from some index onward rather than to every thumbnail, which means threading a position through `MediaThumbnail` — the same prop that would let the first thumbnail carry `fetchpriority="high"` and close the other half of the failing `lcp-discovery` audit. Still this repo, still no deploy.

5. **No `Cache-Control` on `index.html`.** Confirmed absent entirely, and CloudFront's `CachingOptimized` default TTL means a deploy can serve stale HTML for up to 24 hours. A correctness problem more than a performance one.

### What shipped on 2026-09-10, and what it bought

Four of the five back end performance changes went out in one `sam deploy`. Verified against production by `curl`, `aws cloudfront list-distributions` and `aws lambda list-functions`:

| Change                 | Before                   | After                                  |
| ---------------------- | ------------------------ | -------------------------------------- |
| Image CDN HTTP version | `http1.1`                | `http2and3`, on all five distributions |
| Root album on the wire | 28,135 bytes             | 8,140 bytes                            |
| `Timing-Allow-Origin`  | absent                   | present on the API and image origins   |
| `GenerateDerivedImage` | 256MB, averaging 3,768ms | 1024MB, 680–1,421ms                    |

Measured with the pre-change script, so the before and after are like for like:

| Segment         | Before | After | Δ      |
| --------------- | ------ | ----- | ------ |
| Shell           | 139ms  | 144ms | +5ms   |
| Album JSON      | 562ms  | 467ms | −95ms  |
| Thumbnails (65) | 394ms  | 232ms | −162ms |
| LCP             | 800ms  | 736ms | −64ms  |
| Fully settled   | 1095ms | 843ms | −252ms |

Two things are worth keeping from that.

The compression estimate in this document was wrong, and wrong in an instructive direction. It predicted roughly 30ms on a slow mobile link and close to nothing on broadband, reasoning from bandwidth: 20KB saved is sub-millisecond at broadband speed, and the measured transfer tail after first byte was indeed under a millisecond. It delivered 95ms. The mechanism it ignored is TCP slow start — a 28KB response needs several round trips before the congestion window opens, while an 8KB one largely fits the first burst. Payload size buys latency, not just bandwidth.

The `GenerateDerivedImage` figures also confirm why the memory was raised. Peak memory used across those invocations was 167–189MB, nowhere near the 1024MB allocated: the memory was bought for the CPU that comes with it, exactly as the template comment claims. Only three invocations, so hold the range loosely — and the next full vCPU boundary is 1769MB if it ever looks worth testing.

### The second deploy on 2026-09-10, and what it bought

The back end followed with four more changes in one release: source maps off for the API lambdas (a sixfold drop in bundle size), memory from 256MB to 1024MB across the board, a move to arm64, and AWS SDK clients hoisted so they are reused across invocations.

| Segment              | Before | After | Δ      |
| -------------------- | ------ | ----- | ------ |
| Shell                | 130ms  | 122ms | −8ms   |
| Album JSON           | 452ms  | 341ms | −111ms |
| Thumbnails on screen | 161ms  | 165ms | +4ms   |
| LCP                  | 688ms  | 568ms | −120ms |
| Settled              | 743ms  | 628ms | −115ms |

The album leg's spread was 446–483ms, 37ms wide against a 111ms change, so this is the first result the instrument's own error bars comfortably support.

The window is clean: the earlier release went out at 08:59 UTC, this "before" was taken at 09:23, and this release landed at 10:09. The 111ms on the album leg belongs to this change alone.

`GetAlbum`'s median execution fell from 170ms to 22ms, and **the mechanism is connection reuse, not CPU**. Holding code, memory and architecture constant and varying only how long the function sat idle:

| Idle before request | `GetAlbum` duration                           |
| ------------------- | --------------------------------------------- |
| sustained           | 8–15ms                                        |
| 60s                 | 15ms                                          |
| 120s                | 18ms                                          |
| 240s                | 104ms                                         |
| 480s                | 157ms, plus 234ms init — environment recycled |

The step between two and four minutes is the DynamoDB connection dropping and being renegotiated, which puts the handshake at about 85ms on its own. Before this release `getAlbumAndChildren` constructed three or four `DynamoDBClient`s per invocation, each with its own pool, so a single request paid that several times over. Peak memory is 100–117MB of the 1024MB allocated and the handler does a couple of DynamoDB round trips and some JSON: there was never 150ms of CPU in it to reclaim.

That distinction decides what to do next. The CPU story predicts more memory would keep helping; the connection story predicts it will not.

It got cheaper anyway: 0.25GB for 170ms is 0.0425 GB-seconds, against 1GB for 22ms at arm64's 80% rate — roughly 2.4x less per invocation, having quadrupled the memory.

**What cannot be attributed.** The four changes shipped as one release and were not measured independently. Client reuse owns the warm win, on the evidence above. Source maps bought nothing measurable — the bundle fell from 614KB to 162KB and `NODE_OPTIONS` went away, but init is flat, so any gain is inside the noise. The contribution of memory and arm64 is unresolved: a cold invocation handshakes either way, and previously did so three or four times, which hides the effect. Given flat init and a fully explained warm win, their share is probably small — but that is inference, not measurement, and separating it would take three staging deploys reverting one thing at a time.

Nothing broke: zero `Errors` across eight prod functions since the deploy, API Gateway 5XXError at zero, 0.00% CloudFront 5xx, and no error-level log lines in `GetAlbum`, `Search` or `GenerateDerivedImage`. Neither session checked DynamoDB throttles or SDK-level retries, so that is a thin slice rather than a clean bill.

`GenerateDerivedImage` and `ProcessMediaUpload` stayed on x86_64. This is declined with the reason recorded in the template, not deferred work in flight. Both depend on `layer:sharp-heic:1`, a native x86_64 build produced by a separate CodeBuild project and pinned by ARN; moving them means cross-compiling libheif, libde265 and libvips for aarch64 and republishing. The volume makes the case: `GenerateDerivedImage` ran 35 times in seven days against 794 `GetAlbum` invocations, so about 4% of album views trigger a generation at all, and it has not run once since this deploy. Cross-compiling that stack to shave 10–20% off a rare first-viewer-only wait is poor value. Pre-generating the standard thumbnail size at upload removes the wait instead of shortening it, and is the better use of the same effort.

### Preconnect hints work

`preconnect` hints for the API, image and auth origins ship in `app.html`, derived from the page's own hostname so one template serves every environment. Lighthouse against staging confirms them: the three hinted origins resolve in 0–0.2ms against 59.8ms for the unhinted `staging-pix.tacocat.com`, all three are listed under "Preconnected origins" with no warnings, and no further origin is worth hinting.

**The headless Chromium that Playwright bundles ignores `<link rel="preconnect">` entirely, so `npm run perf` cannot measure these hints and four careful experiments here wrongly concluded they were worthless — treat any _no effect_ result from that script as a claim about the instrument until a real browser confirms it.**

Two notes for whoever measures next. `crossorigin` is not decoration: credentialed requests use their own connection pool, so the API and auth hints must carry no `crossorigin`, while `crossorigin="anonymous"` would warm a pool nothing draws from. And a five-run sample once showed the image origin reusing a connection twice, which looked like signal and was not; twelve runs showed none.

### What a real browser says about production, on a phone

Lighthouse against `https://pix.tacocat.com/2022/11-27` on 2026-09-10, in a real Chrome under mobile emulation and Lighthouse's standard simulated throttling: a 412x823 viewport, 150ms RTT, 1.6Mbps down, 4x CPU slowdown. Every other measurement in this document was taken on a desktop viewport over a fast connection, which is a kinder test than most of the traffic gets.

**Performance 87, and a single metric owns the loss:**

| Metric                       | Value    | Score    | Weight | Points lost |
| ---------------------------- | -------- | -------- | ------ | ----------- |
| Total Blocking Time          | 46ms     | 1.00     | 30     | 0           |
| Cumulative Layout Shift      | 0        | 1.00     | 25     | 0           |
| Speed Index                  | 2.1s     | 0.99     | 10     | 0.1         |
| First Contentful Paint       | 2.1s     | 0.80     | 10     | 2           |
| **Largest Contentful Paint** | **3.8s** | **0.56** | **25** | **11**      |

The JavaScript is not the problem, and it is worth recording how firmly: `unused-javascript`, `unused-css`, `legacy-javascript` and `duplicated-javascript` all report **zero recoverable bytes**, and there are no third-party entities on the page at all.

**Images are 94% of the page.** Of 1,374,107 bytes transferred, 1,288,064 are the 47 thumbnails — a mean of 27.4KB each for something rendered at 200x200. The entire application, 27 JavaScript chunks and 10 stylesheets and the document itself, comes to 84KB. Lighthouse's `image-delivery` insight is the only one scoring zero, putting **622KiB of those thumbnails as recoverable** across 32 of them, every one for the same reason: a modern format, or heavier compression.

**Three thumbnails are visible and 47 are fetched.** On a 412px viewport the first spans y=192–392, the second 437–637, and the third is cut off by the fold at 823. That is a sharper version of the desktop ratio recorded above — 16 of 65 — and it points the same way.

The preconnect hints are confirmed in production, independently of the staging evidence: all three origins appear under "Preconnected origins" with no warnings attached, and Lighthouse concludes that no further origin is worth hinting.

**Where the LCP goes.** The LCP element is the first thumbnail.

| Subpart                | Time  |
| ---------------------- | ----- |
| Time to first byte     | 250ms |
| Resource load delay    | 184ms |
| Resource load duration | 32ms  |
| Element render delay   | 54ms  |

The 184ms of load delay is the application discovering the image URL, which it cannot do until the album JSON arrives. Lighthouse's `lcp-discovery` audit fails on exactly that — `requestDiscoverable` is false because the URL exists only after an API round trip, which is inherent to a client-rendered SPA — and also on `priorityHinted`, because the image carries no `fetchpriority`. The second of those is one attribute.

**The back end origins still show their shape.** `pix.` and `img.` negotiated HTTP/3; `api.` and `auth.` are on HTTP/2, which is the REGIONAL API Gateway visible from the front end. Server latency by origin: `auth.` 145ms, `api.` 110ms, `pix.` 26ms, `img.` 25ms. The slowest origin on the page is the one whose job is to tell anonymous visitors that they are not logged in.

**One request never finished.** The run carries Lighthouse's "page loaded too slowly to finish within the time limit" warning and ran the full 45-second cap, although every request completed inside 680ms. `https://auth.pix.tacocat.com/` is the only record in the log marked `"finished": false`, and the 401 branch in `SessionStore` returns without reading or cancelling `response.body`. That is a suspect and not a diagnosis — a 31-byte body often completes regardless — but it costs one line to test: cancel the body before returning and see whether the run still hits the cap. Worth resolving before trusting a score from this harness, since an unfinished request is also the most likely reason a local run scores below the same page on `pagespeed.web.dev`.

### What multi-region probes say about the API origin

Two Grafana Cloud synthetic checks run against production from Ohio, NorthCalifornia and Paris, against `https://pix.tacocat.com/` and `https://api.pix.tacocat.com/album/`. Connect plus TLS, in ms:

| Probe           | SPA (`pix.`) | API (`api.`) |
| --------------- | ------------ | ------------ |
| Ohio            | 14           | **27**       |
| NorthCalifornia | 13           | **119**      |
| Paris           | 18           | **171**      |

**Ohio is the control that makes this a diagnosis.** Ohio is us-east-2, beside the us-east-1 region the API runs in, and reaches the API in 27ms while the SPA costs it 14ms from the same probe. The API is not slow and the network is not slow: the API is _in one place_, and everyone else pays to reach it. The SPA, behind CloudFront, costs 13–18ms from everywhere. So consolidating `/api/*` behind the SPA distribution — already the top-ranked fix above on US numbers — is worth roughly 90ms to a Californian and 150ms to a European. The handshake figures reproduced to within 1.5ms; `curl` agrees on the shape at 44ms to `pix.` against 156ms to `api.`

Two cautions. `resolve` from these probes is noise for a check's first few runs, when its DNS cache is cold — one Paris sample read 271ms and settled to 110ms; `connect` and `tls` are measured after resolution and unaffected. And Paris `processing` has run 5–7x NorthCalifornia's across samples, which distance does not explain; worth a look once a few weeks exist.

**Current config.** Both checks send an explicit `Accept-Encoding` header and assert the encoding returned — gzip for the API, br for the SPA — so they measure the compressed path browsers use, and a lost `MinimumCompressionSize` fails the check. SSL required; the API does not follow redirects. HTTP version is deliberately unpinned: `probe_success` is one bit, so every property a check enforces is another way for a healthy site to report itself down, and `probe_http_version` is recorded regardless. `blackbox_exporter` has no HTTP/3, so it reports HTTP/2 against `pix.` whatever `http2and3` does. These are single-request probes: no thumbnails, no LCP, no connection reuse — `npm run perf` and Lighthouse still own that.

### The origin still invisible to measurement

`Timing-Allow-Origin` now ships on the API and image origins, but `auth.pix.tacocat.com` sends only CORS headers, so its connection and transfer timings read as empty from the page. It is a real origin on every page load, and it is the one that cannot be measured. The header lives in `tacocat-gallery-auth`, which was outside the scope of the change that fixed the other two.

### What is watching production today

Two Grafana Cloud synthetic checks, added on 2026-09-10 and covered in the section above, and otherwise nothing. One CloudWatch alarm exists, on `AWS/Lambda Errors`, for **dev**. There is an SNS topic wired to email, also dev-only. CloudFront access logs are disabled on all five distributions, no tracing is enabled anywhere, there are no canaries, no budget, and 74 of the 75 Lambda log groups are set to never expire.

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

`npm run perf` runs `scripts/measure-perf.mjs`: a headless browser against production, six runs, reporting the median and spread of each critical-path segment across the last five. Run it before a change and after, and check that the spread is smaller than the difference before believing the difference. The first run is reported separately rather than folded in, because it is the only one that meets the cold edge and cold Lambda most visits meet — see _Cold starts_ for how badly that distinction was got wrong here.

That is the entire measurement apparatus. It needs no AWS changes, no vendor, no budget, and it survives a year of neglect because it is a file in a repo rather than a configuration in a console.

Its value is not theoretical. Over the course of designing this document the ranking of performance fixes was revised three times, each time because a measurement contradicted a plausible-sounding argument — that HTTP/2 on images was the biggest lever, that cold starts cost 1,200ms, and that compressing the album response would barely register.

Its limits are not theoretical either. It runs on the headless Chromium that Playwright bundles, which ignores `preconnect` hints, so anything this tool reports as _no effect_ deserves a second opinion from a real browser before it is believed.

It is a measuring instrument, so it needs the same scepticism as the things it measures. Three of its readings were misleading and are now fixed — it warmed the cache it was measuring, it then hid the one cold run it had, and it timed thumbnails nobody could see. Its pure arithmetic is covered by `scripts/measure-perf.spec.mjs`; the test that matters asserts that the thumbnail segment gives the same answer whether or not the offscreen images were requested at all, which is the reading that would otherwise turn a lazy-loading change into a fake 40% win.

### Performance fixes, in measured order

What is left, after the 2026-09-10 deploy:

1. Keep `GetAlbum` warm, or take album reads off Lambda. Largest win by a distance once weighted by who pays it: ~455ms on roughly three quarters of arrivals, against ~155ms on all of them for the item below. A two-minute ping is the cheap version and costs about a penny a month; serving album JSON from S3 through CloudFront is the thorough one and lands on the same origin as the consolidation.
2. Consolidate the three domains behind one distribution. The largest item in a _warm_ album leg: with `GetAlbum` down to a 22ms median, the ~155ms handshake to a second origin is what is left of it.
3. `loading="lazy"` from the first offscreen thumbnail onward, plus `fetchpriority="high"` on the first, both in this repo. No deploy. It stops 49 of 65 images being fetched for a desktop viewport that holds 16, and 44 of 47 on a phone that holds three.
4. `Cache-Control` on `index.html`.

`preconnect` hints for the API, image and auth origins ship in `app.html` and recover part of the handshake while consolidation is outstanding. They are a mitigation, not a substitute: the connection is still to a separate host, so consolidation still has the larger prize.

Shipped: `HttpVersion: http2and3`, API compression, `Timing-Allow-Origin`, `GenerateDerivedImage` memory, and then arm64, 1024MB, no API source maps and reused SDK clients. See the two records above for what each round bought.

### Consolidating the origins

Do the API first, and not all of it at once.

| Move                             | Recovers                                       | Costs                                                                                     |
| -------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/api/*` on the SPA distribution | ~155ms: edge termination plus connection reuse | One behaviour, one origin, and a coordinated change across two repos                      |
| `/i/*` on the SPA distribution   | ~45ms                                          | Moving three origins, an origin group with 403/404 failover, and two CloudFront Functions |

The API is 3.4x the return for a fraction of the work, and it leaves the fiddliest machinery where it is. Expect 100–150ms rather than the full 155ms — the edge-to-origin hop to us-east-1 is not free — and measure rather than assume.

**Same-origin is the durability argument, and it may matter more than the latency.** `/api/*` under `pix.tacocat.com` retires the `Cors` block in the SAM template — `AllowCredentials: true` against a single hardcoded `AllowOrigin` — and the `credentials: 'include'` cross-origin story with it. Fewer moving parts that have to stay correct for decades.

The offsetting cost is that the SPA's API base URL has to move in step with the CloudFront behaviour, across two repositories, in one coordinated change.

**Switching the API Gateway domain to EDGE is the fallback, not the first move.** It moves TLS termination to an edge but still leaves a separate hostname to look up, connect to and negotiate, so it recovers ~110ms of the ~155ms rather than all of it. It is reachable without configuration drift, but only by dropping SAM's `Domain` shorthand and declaring `AWS::ApiGateway::DomainName` and `AWS::ApiGateway::BasePathMapping` directly, so that `Types` can carry both endpoints during a two-deploy migration. That means owning two resources SAM manages today, for the life of the project.

What makes the CLI shortcut unacceptable rather than merely untidy: CloudFormation diffs each template against the previous template, not against live state. A hand-migrated domain would therefore survive silently, with deploys continuing to succeed, until some unrelated future change touched that resource — a certificate rotation is the likely trigger — at which point the stack would assert `Types: [REGIONAL]` and `RegionalCertificateArn` against a live edge-optimized domain. A landmine armed now and detonating years later, in a stack whose defined-as-code requirement exists because console drift already cost a three-day unnoticed outage.

**There is no Route53 hosted zone in this account.** DNS lives at an external registrar, and `api.pix.tacocat.com` is a CNAME to `d-pbw01cw1w4.execute-api.us-east-1.amazonaws.com`. Every route here — EDGE or consolidation — needs a manual DNS edit. "No drift" and "no manual steps" are different claims, and only the first is available.

**Putting the API behind CloudFront puts a cache in front of authenticated responses.** `isAuthenticatedForReads` decides on the presence of an `id_token` cookie, so a cache key that ignores cookies would serve an admin's unpublished-album response to the next anonymous visitor. `CachingDisabled` on that behaviour from the first day. The origin should defend itself too: `respondHttp` currently sets no `Cache-Control` and no `Vary` at all, so correctness would rest entirely on one CloudFront setting being right forever, with nothing to catch a mistake. `Cache-Control: private, no-store`, or at minimum `Vary: Cookie`, belongs in the same change.

Edge-caching public album JSON is a large further win and exactly the change that does real damage if the auth story is wrong. Separately, deliberately, later.

### A fourth origin nobody asked for

Every page load, for every anonymous visitor, includes this:

```
218ms  GET  https://auth.pix.tacocat.com/
218ms  GET  https://api.pix.tacocat.com/album/
523ms  GET  https://api.pix.tacocat.com/latest-album/
```

`auth.` is another regional API Gateway domain, so a visitor who has never logged in pays a full transcontinental handshake to be told so. It runs in parallel with the album rather than ahead of it, so it blocks nothing directly, but it is a fourth connection competing during the only part of the load that matters, and it is waste for very nearly all traffic. Whether that check needs to happen before first paint is a question for whoever moved it to the root layout; deferring it past first paint would remove the handshake rather than hide it.

`/latest-album/` is a second API call that depends on the first. It reuses the connection so costs no handshake, but it is another round trip after the album returns.

## Changes to `tacocat-gallery-sam`

Everything lives in one `template.yaml`. Deploy to dev (`sam deploy`), then test (`sam deploy --config-env test`); prod goes through GitHub Actions and must not be deployed by hand. Make one change at a time and run `npm run perf` in `tacocat-gallery-sveltekit` after each.

Five changes shipped on 2026-09-10, in two releases. The reasoning for each now lives in the template beside the code; what they bought is measured above.

| Change                                                   | Why                                                                                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Timing-Allow-Origin` on the API and image origins       | Without it both origins report `protocol: unknown, kb: 0` and are invisible to any browser-side measurement |
| `HttpVersion: http2and3` on `ImageDistribution`          | It had no `HttpVersion` at all, so CloudFormation defaulted it to HTTP/1.1                                  |
| `MinimumCompressionSize: 1000` in `Globals.Api`          | Nothing was compressed; the root album was 28,135 bytes on the wire                                         |
| `MemorySize: 1024` globally, `SyncRedis` pinned to 256MB | Bought CPU, not headroom — peak use is a tenth of the allocation                                            |
| `GenerateDerivedImageFunction` to 1024MB                 | Averaged 3,768ms at 256MB                                                                                   |

The `SyncRedis` pin rests on an I/O-bound argument recorded in the template and was never measured — the one configuration decision in the release with no data behind it.

### 6. The outage alarm

The obvious threshold — CloudFront `4xxErrorRate` above 10% for 15 minutes — does not survive contact with the metric. Measured over the three quietest recent days on the prod image distribution, **23 of 65 fifteen-minute windows exceed 10%**, with individual windows at 75%, 66.7%, 60% and 50%. Those are days whose daily averages are 0.66%, 1.66% and 4.6%.

The cause is the denominator. Most 15-minute windows on this distribution contain one to three requests. A single 404 in a one-request window is a 100% error rate. Widening the period does not rescue it either: two of the last ten days contain a six-hour window at exactly 100.0%. The 10% threshold was derived from daily averages and then applied to a fifteen-minute period, which is a different statistic.

A rate metric is only meaningful above some volume, so guard it with one. Metric math, gated on the existing `IsProd` condition (`template.yaml:97`):

```yaml
ImageDistribution4xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Condition: IsProd
    Properties:
        AlarmName: !Sub ${AWS::StackName}-image-cdn-4xx
        AlarmDescription: Most image requests are failing during a period when people are actually browsing
        ComparisonOperator: GreaterThanThreshold
        Threshold: 25
        EvaluationPeriods: 1
        TreatMissingData: notBreaching
        AlarmActions:
            - !Ref ErrorsTopic
        Metrics:
            - Id: guarded
              Expression: IF(requests > 200, errorRate, 0)
              Label: 4xx rate when traffic is high enough to mean anything
              ReturnData: true
            - Id: requests
              ReturnData: false
              MetricStat:
                  Period: 3600
                  Stat: Sum
                  Metric:
                      Namespace: AWS/CloudFront
                      MetricName: Requests
                      Dimensions:
                          - Name: DistributionId
                            Value: !Ref ImageDistribution
                          - Name: Region
                            Value: Global
            - Id: errorRate
              ReturnData: false
              MetricStat:
                  Period: 3600
                  Stat: Average
                  Metric:
                      Namespace: AWS/CloudFront
                      MetricName: 4xxErrorRate
                      Dimensions:
                          - Name: DistributionId
                            Value: !Ref ImageDistribution
                          - Name: Region
                            Value: Global
```

Traffic is bursty rather than steady — quiet 15-minute windows hold one or two requests while the busiest hold 1,308 — so a 200-request floor over an hour means the alarm is only evaluated during an actual browsing session, which is exactly when a broken image CDN matters. Ten days of metrics is not enough to tune that floor properly; start there and check `aws cloudwatch describe-alarm-history` after a few weeks before trusting it.

Two things that will bite:

- CloudFront metric alarms need `Region: Global` as a second dimension alongside `DistributionId`, and must live in `us-east-1`. Everything here already does.
- The alarm and its SNS topic both need defining in this template. Today's alarm is named "Email Moses on Tacocat Gallery - dev error" and points at `arn:aws:sns:us-east-1:010410881828:Tacocat_Gallery_dev_Errors_Topic`; neither appears in any template in any of the four repos, so both were created by hand in the console. That is precisely the drift the fifth requirement above warns about. A CloudFormation-created email subscription sends a confirmation email that has to be clicked, and until it is, the alarm fires into nothing.

### 7. Housekeeping

**Log retention.** 73 of the 74 log groups in the account have no retention set. `AWS::Serverless::Function` has no retention property — `LoggingConfig` covers format and level only — so doing this as code means an explicit `AWS::Logs::LogGroup` per function, named `/aws/lambda/${FunctionName}`. That is forty-odd resources and several hundred lines of YAML for a housekeeping task, which fails the value-per-line test badly enough to justify a deliberate exception to the fifth requirement: sweep the existing groups with a one-off `aws logs put-retention-policy` loop, and accept that new functions will need the same sweep again. 30 days for dev and test, 90 for prod.

**A budget.** Create one AWS Budget at a threshold that would be surprising.

**CloudFront access logs.** `Logging.Enabled` is absent on all five distributions. Enabling standard logging to S3 on the prod image distribution needs a log bucket, a `Logging` block, and a 90-day lifecycle rule — around 25 lines. It is the only item here that cannot be done retroactively: the September incident cannot be diagnosed now because no logs were ever written, and the same will be true of the next one for every day this stays off.

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

| Option                                    | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| More memory (chosen, on a wrong premise)  | Shipped on a premise the measurements killed — see _Cold starts_. Harmless and slightly cheaper here, but not a lever on cold starts; more of it will not help.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Reusing SDK clients across invocations    | The change that actually mattered, though it belongs under warm latency rather than cold starts. Median execution 170ms to 22ms.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Serving album JSON from S3 via CloudFront | Removes Lambda from the read path entirely — no cold start, no duration, edge-cached, and it lands on the same origin once the domains are consolidated. The most thorough answer; a larger change.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Scheduled keep-warm pings (revisit)       | **Rejected on a denominator that was wrong by 15x.** "~490ms on a twentieth of requests" became ~455ms on three quarters of arrivals once the cold-start rate was measured properly. A two-minute EventBridge rule is 21,600 invocations a month, about a penny at 1024MB on arm64, and two minutes is the load-bearing detail: five minutes keeps the environment alive but lets the DynamoDB connection lapse (~104ms), two holds both (~15–20ms). Two costs to weigh — it warms one environment, so a second concurrent arrival still pays, and it destroys the log evidence above by making every real arrival follow a ≤2min gap. |
| Provisioned concurrency                   | Rejected on cost for a site at this traffic.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### How to know it broke

| Option                                                         | Verdict                                                                                                                                                                                                                                   |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One CloudFront 4xx alarm (chosen)                              | Matches the only incident this system has actually had, with a threshold derived from its own baseline.                                                                                                                                   |
| Six alarms across CloudFront, Lambda, DynamoDB and API Gateway | Rejected against the requirement to keep reading them. A channel with false positives gets filtered to a folder, and the next incident is missed exactly as September was.                                                                |
| External uptime monitor                                        | Rejected for availability alerting, and that reasoning stands. Adopted anyway as Grafana Cloud synthetic checks, for a purpose this table did not anticipate: multi-region probes measure the geographic cost of the regional API origin. |
| CloudWatch Synthetics                                          | Rejected before the above: same region as what it watches, and 100 free runs a month against the 730 an hourly check needs.                                                                                                               |
| GitHub Actions scheduled canary                                | Rejected: GitHub disables scheduled workflows after 60 days without a commit, and some of these repos change twice a year. It would stop silently.                                                                                        |

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
