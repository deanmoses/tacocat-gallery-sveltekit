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

The script discards a warm-up run and prints the spread behind every median, both of which it earned the hard way. Three back-to-back invocations drifted downwards on every metric — LCP 736ms, then 688ms, then 668ms — because repeated runs keep the edge cache warm that 85 views a day let go cold. Without the warm-up discard, an "after" measured later in a session beats a "before" measured earlier whether or not anything improved. And the spread separates what the tool can prove from what it cannot: across those same invocations the album and thumbnail segments held to within 24ms and 8ms, while LCP moved by 68ms — wider than several of the wins being attributed to it.

### Traffic

Production is small. Over the seven days ending 2026-09-09: 9,758 requests to the SPA distribution, 6,909 to the image distribution, and 624 `GetAlbum` invocations — roughly 85 album views a day.

That number drives most of what follows. It means CDN log analysis has little signal, it means a fifth of Lambda invocations are cold, and it means per-event pricing is affordable.

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

From the `platform.report` records in the `GetAlbum` log group, after the arm64 deploy:

```
invocations  37       coldStarts  2 (5%)
medianInitMs 323      medianDurationMs  22      avgDurationMs  30      maxDurationMs  216
maxMemoryUsedMB  100-117 of 1024
```

A cold request costs roughly 490ms more than a warm one: ~320ms of init, plus a cold execution of around 191ms against the 22ms warm median. Both halves count. Quoting init alone is the easy mistake, and it understates the penalty by more than a third.

**Init did not move**, and it is worth stating plainly rather than as a suspicion. It was ~330ms at 256MB on x86 with source maps and is ~322ms at 1024MB on arm64 with a bundle a quarter of the size (614KB to 162KB). Across both environments:

| Sample      | n   | avg init | p50   | p90   |
| ----------- | --- | -------- | ----- | ----- |
| dev before  | 50  | 314ms    |       |       |
| dev after   | 64  | 296ms    | 303ms | 319ms |
| prod before | 142 | 321ms    |       |       |
| prod after  | 2   | 322ms    |       |       |

Six percent in dev, nothing in prod. Init is dominated by sandbox and runtime bootstrap, which neither more CPU nor a smaller zip touches. The dev cold starts were forced with a synthetic concurrency burst rather than drawn from organic traffic, and concurrent cold starts need not behave like isolated ones — but the answer does not wobble between two environments and two collection methods.

The prediction this falsifies was that init and execution were both CPU-bound, and that raising memory would therefore cut them together. Neither half held: init is not CPU-bound at all, and execution turned out to be bound by something else again — see the DynamoDB connection timings below. It is the third time in this document that a plausible mechanism survived until someone measured it, which is the argument for the measuring in the first place.

### Findings still open

Ranked by measured contribution to a warm page load:

1. **Four origins, and the expensive one is not behind a CDN.** A page load touches `pix.`, `api.`, `img.` and `auth.`, each costing its own DNS, TCP and TLS. They are not equal:

    | Origin                             | TLS complete, 5 runs |
    | ---------------------------------- | -------------------- |
    | `pix.tacocat.com` (CloudFront)     | 42–61ms              |
    | `img.pix.tacocat.com` (CloudFront) | 43–78ms              |
    | **`api.pix.tacocat.com`**          | **152–160ms**        |

    `api.` and `auth.` are **REGIONAL** API Gateway custom domains, so their TLS terminates in us-east-1 rather than at an edge. Every visitor pays a transcontinental round trip for a connection the other two get locally. With `GetAlbum` now executing in 22ms, that ~155ms handshake is the largest single item left in the page load.

    The usual argument for consolidating — that domain sharding is an obsolete HTTP/1.1 workaround — is true but does no work here. These are not shards of one asset class; they are functionally distinct origins, and serving an API from its own hostname is a defensible architecture. The case rests on the measurement above, not on the principle.

2. **Thumbnails are JPEG, and far heavier than their size suggests.** A 200x200 thumbnail costs 18–30KB. A day album of 32 of them is 709KB of image transfer, and Lighthouse puts ~460KB of that as recoverable by encoding WebP or AVIF instead. That is larger than every latency win recorded in this document combined, and it is a change to `GenerateDerivedImage` rather than to the front end. Serving a modern format also has to survive browsers that cannot read it, so it needs either content negotiation on `Accept` at the edge or a `<picture>` element with a JPEG fallback — neither of which exists today.

3. **Every thumbnail loads eagerly.** At 1440x900 the root album puts 16 of its 65 thumbnails on screen and fetches all 65 — roughly 560KB nobody looks at, contending with the ones they do. `Thumbnail.svelte` sets `decoding="async"` but no `loading`. In-viewport images are still fetched immediately under `loading="lazy"`, so there is no LCP cost to weigh against it. One attribute, in this repo, with no deploy.
4. **No `Cache-Control` on `index.html`.** Confirmed absent entirely, and CloudFront's `CachingOptimized` default TTL means a deploy can serve stale HTML for up to 24 hours. A correctness problem more than a performance one.

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

### Preconnect hints work, and four measurements said otherwise

`preconnect` hints for the API, image and auth origins ship in `app.html`, derived from the page's own hostname so one template serves every environment. They help. Every measurement taken in this repository said they did nothing, and every one of those measurements was wrong.

The evidence that settled it came from Lighthouse, driven by a real Chrome against staging with the hints deployed. Its `network-rtt` audit reports what each origin cost to connect to:

| Origin                         | Observed RTT | Preconnected |
| ------------------------------ | ------------ | ------------ |
| `staging-pix.tacocat.com`      | 59.8ms       | no           |
| `auth.staging-pix.tacocat.com` | 0.18ms       | yes          |
| `api.staging-pix.tacocat.com`  | 0.10ms       | yes          |
| `img.staging-pix.tacocat.com`  | 0ms          | yes          |

The three hinted origins cost essentially nothing to reach; the one origin without a hint pays the full round trip. Lighthouse also lists all three under "Preconnected origins" with no warnings attached — that is where it reports a hint that went unused — and concludes that no further origins are worth hinting.

**The instrument was the problem.** The headless Chromium that Playwright bundles does not act on `<link rel="preconnect">` at all. Checked on an inert page with a three-second pause before the fetch, where a working hint must show a reused socket, it shows a full handshake with the hint and without it. Every "preconnect does nothing" result in this repository was a measurement of that browser, not of the site.

The sequence is worth keeping, because each step looked like progress:

1. **+20–45ms.** Hints injected through Playwright's `addInitScript`, which runs before the document is parsed — earlier than shipped markup can be. A flattering artifact.
2. **−72ms**, hints apparently making the page slower. The HTML was rewritten in flight to place the hints where they would really live, but only the treatment arm paid the cost of that interception.
3. **Zero**, from interception in both arms with a same-length placebo in the control. Methodologically sound, and still wrong, because the browser underneath ignored the hints.
4. **Zero again**, from a real deployment to staging, twelve runs, `connectEnd - connectStart` never dropping to zero. Same browser, same blind spot. This one felt conclusive because it removed every confound anyone had thought of.

Each fix addressed a real flaw and moved the number, which is exactly what made the final answer persuasive. The flaw none of them touched was the one that mattered.

The lesson is narrower than "measure carefully" and worth stating plainly: **a null result is a claim about the instrument until the instrument has been checked against a case with a known answer.** Four experiments refined the arms and never once asked whether the browser could observe the effect at all. Validating a harness costs one test — hint, wait longer than any handshake could take, look for a reused socket — and it would have caught this before the first table was drawn.

Two further notes for whoever measures next. `crossorigin` is not decoration: credentialed requests use their own connection pool, so the API and auth hints must carry no `crossorigin` (or `use-credentials`), while `crossorigin="anonymous"` would warm a pool nothing draws from. And an interim sample of five runs once showed the image origin reusing a connection twice, which looked like a signal and was not; twelve runs showed none. A small sample of a binary outcome manufactures exactly that phantom.

### The origin still invisible to measurement

`Timing-Allow-Origin` now ships on the API and image origins, but `auth.pix.tacocat.com` sends only CORS headers, so its connection and transfer timings read as empty from the page. It is a real origin on every page load, and it is the one that cannot be measured. The header lives in `tacocat-gallery-auth`, which was outside the scope of the change that fixed the other two.

### What is watching production today

Nothing. One CloudWatch alarm exists, on `AWS/Lambda Errors`, for **dev**. There is an SNS topic wired to email, also dev-only. CloudFront access logs are disabled on all five distributions, no tracing is enabled anywhere, there are no canaries, no budget, and 74 of the 75 Lambda log groups are set to never expire.

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

`npm run perf` runs `scripts/measure-perf.mjs`: a headless browser against production, a discarded warm-up plus five runs, reporting the median and spread of each critical-path segment. Run it before a change and after, and check that the spread is smaller than the difference before believing the difference.

That is the entire measurement apparatus. It needs no AWS changes, no vendor, no budget, and it survives a year of neglect because it is a file in a repo rather than a configuration in a console.

Its value is not theoretical. Over the course of designing this document the ranking of performance fixes was revised three times, each time because a measurement contradicted a plausible-sounding argument — that HTTP/2 on images was the biggest lever, that cold starts cost 1,200ms, and that compressing the album response would barely register.

Its limits are not theoretical either. It runs on the headless Chromium that Playwright bundles, which does not act on `preconnect` hints, and four increasingly careful experiments therefore concluded that those hints were worthless. They are not. Nothing in the script's output disclosed the gap, and no amount of refining the comparison would have. Anything this tool reports as _no effect_ deserves a second opinion from a real browser before it is believed.

It is a measuring instrument, so it needs the same scepticism as the things it measures. Two of its readings were misleading and are now fixed — it warmed the cache it was measuring, and it timed thumbnails nobody could see. Its pure arithmetic is covered by `scripts/measure-perf.spec.mjs`; the test that matters asserts that the thumbnail segment gives the same answer whether or not the offscreen images were requested at all, which is the reading that would otherwise turn a lazy-loading change into a fake 40% win.

### Performance fixes, in measured order

What is left, after the 2026-09-10 deploy:

1. Consolidate the three domains behind one distribution. Largest win by a wider margin than before: with `GetAlbum` down to a 22ms median, the ~155ms handshake to a second origin is the biggest remaining item in the album leg.
2. `loading="lazy"` on the thumbnail in this repo. One attribute, no deploy, and it stops 49 of 65 images being fetched for a viewport that holds 16.
3. `Cache-Control` on `index.html`.

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

### Outages

**One alarm: CloudFront `4xxErrorRate` on the production image distribution, above 10% for 15 minutes**, delivered to a production clone of the existing SNS topic.

That threshold comes from the data above: the baseline runs 1.4–3.8% and the September incident ran 32–68%, so 10% separates them with margin on both sides. It is the failure mode that has actually occurred here.

A second alarm on Lambda `Errors` was considered and dropped. It would not have caught September, and code defects surface through the integration tests that run on deploy.

### Housekeeping

Not observability, but cheap and adjacent: set retention on the 69 log groups (30 days for dev and test, 90 for production), and create one AWS Budget at a threshold that would be surprising. Enable CloudFront standard logging to S3 on the two production distributions with a 90-day lifecycle rule — delivery is free, storage is pennies, and logs cannot be created retroactively.

## Changes to `tacocat-gallery-sam`

Everything the back end repo needs to do, written to be actionable from a session rooted in that repo without this document's surrounding context. Ordered by measured value per line changed, not by total value.

**All five shipped on 2026-09-10 and are kept here as the record of what was changed and why. Item 3 landed in a second release, alongside arm64, reused SDK clients and dropping source maps from the API lambdas.**

All numbers below were measured against production: the prod image distribution is `E3R19YIU3JKJRK` (`img.pix.tacocat.com`) and the API is `api.pix.tacocat.com`. Everything lives in one `template.yaml`. Deploy to dev (`sam deploy`), then test (`sam deploy --config-env test`); prod goes through GitHub Actions and must not be deployed by hand.

Make one change at a time and run `npm run perf` in `tacocat-gallery-sveltekit` after each. The current production baseline to beat:

```
Shell 130ms  |  Album JSON 452ms  |  Thumbnails on screen 161ms      LCP 688ms, settled 743ms
```

### 1. Make the API and image origins measurable — SHIPPED

The perf script currently reports `protocol: unknown, kb: 0` for both `api.` and `img.`, because neither origin sends `Timing-Allow-Origin`. Two of the three origins are invisible to any browser-side measurement, including every measurement of the changes below. This is two one-line edits:

In `app/src/lib/lambda_utils/ApiGatewayResponseHelpers.ts`, add one header to the object in `respondHttp`. Every API response goes through that one function, so this covers the whole API:

```ts
'Timing-Allow-Origin': `https://${getGalleryAppDomain()}`,
```

And add one item to `ImmutableResponseHeadersPolicy`'s `CustomHeadersConfig.Items` at `template.yaml:346`:

```yaml
- Header: Timing-Allow-Origin
  Value: !Sub https://${GalleryAppDomain}
  Override: true
```

That policy is attached to the `/i/*` and `/v/*` behaviours, which is where thumbnails and video posters come from, so it does not need to go on `DefaultCacheBehavior`.

Verify: the host table at the end of `npm run perf` should show a real protocol and a non-zero KB figure for all three hosts.

### 2. `HttpVersion: http2and3` on `ImageDistribution` — SHIPPED

`ImageDistribution` (`template.yaml:251`) has no `HttpVersion` property, so CloudFormation defaults it to `http1.1`. Confirmed by curl and by `aws cloudfront list-distributions` — all three `img.` distributions report `HTTP1_1`, while both SPA distributions report `HTTP2`. Sixty-five thumbnails against a six-connection-per-origin limit is 394ms of the warm root album load.

Add one line beside `Comment`:

```yaml
HttpVersion: http2and3
```

Verify: `curl -sI https://img.staging-pix.tacocat.com/ -o /dev/null -w '%{http_version}\n'` should report 2 rather than 1.1.

Note that `tacocat-gallery-sveltekit` may separately add `loading="lazy"` to its thumbnail component, which drops the root album's initial thumbnail count from 65 to the 17 actually on screen. That reduces how much this change is worth on a first paint but does not remove the case for it: day albums are larger, and scrolling still pulls the rest.

### 3. `MemorySize: 1024` on `GetAlbumFunction` — SHIPPED, via a global raise

`GetAlbumFunction` (`template.yaml:693`) inherits `MemorySize: 256` from `Globals.Function` (`template.yaml:105`), which is roughly 0.14 vCPU. The album leg is the largest segment of the page load at 562ms, and a curl breakdown puts about 161ms of that in DNS, TCP and TLS and about 280ms in server time before the first byte. That 280ms is a DynamoDB query plus marshalling and stringifying 28KB of JSON on a seventh of a core.

Set it on the function, not in `Globals` — a Globals change moves forty-odd functions at once and makes the result unattributable.

Whether CPU is actually the binding constraint here is a hypothesis, not a measurement. It is one line, so test it rather than arguing about it, and revert if the album segment does not move.

It landed differently from what is proposed here. Rather than a per-function override, `Globals.Function` was raised to 1024MB for everything, with `SyncRedis` pinned back to 256MB. That pin rests on the I/O-bound argument in the template comment and was not measured — the one configuration decision in the release with no data behind it, and worth recording as an assumption rather than a finding.

Median execution went from 170ms to 22ms, but not for the reason given above. The caution that CPU being the binding constraint was a hypothesis rather than a measurement turned out to be the right caution: the hypothesis was wrong on both counts. Init did not move, and the warm win came from reusing DynamoDB connections. Raising memory here was harmless and marginally cheaper, but it was not what bought the time.

### 4. `MinimumCompressionSize` in `Globals.Api` — SHIPPED

There is no explicit `AWS::Serverless::Api`; the API is the implicit one created from the `Type: Api` function events, configured through `Globals.Api` (`template.yaml:114`), which sets `Name`, `Domain` and `Cors` but not `MinimumCompressionSize`. So nothing is compressed: the root album is 28,135 bytes with and without `Accept-Encoding`. Compressed it is 8,108 bytes under gzip and 6,957 under brotli.

```yaml
MinimumCompressionSize: 1000
```

Set expectations low: the 20KB saved is worth roughly 30ms on a slow mobile link and close to nothing on broadband, where the measured transfer tail after first byte is under a millisecond. It earns its place by being one line, not by being large.

### 5. `GenerateDerivedImageFunction` memory — SHIPPED at 1024MB

`GenerateDerivedImageFunction` inherited 256MB and averaged 3,768ms. It now runs at 1024MB, where three observed invocations took 680ms, 1,227ms and 1,421ms with ~575ms of init. Peak memory used was 167–189MB, so the allocation bought CPU rather than headroom, which is what the reasoning predicted.

Still open here: pre-generating the 200x200 thumbnail size during upload processing, which removes the wait rather than shortening it. Only the first viewer of an uncached size pays this, which in practice means whoever opens a new album first.

### 6. The outage alarm needs a different shape than proposed above

The proposal earlier in this document — CloudFront `4xxErrorRate` above 10% for 15 minutes — does not survive contact with the metric. Measured over the three quietest recent days on the prod image distribution, **23 of 65 fifteen-minute windows exceed 10%**, with individual windows at 75%, 66.7%, 60% and 50%. Those are days whose daily averages are 0.66%, 1.66% and 4.6%.

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

**Log retention.** 73 of the 74 log groups in the account have no retention set, up from the 69 counted when this document was first written. `AWS::Serverless::Function` has no retention property — `LoggingConfig` covers format and level only — so doing this as code means an explicit `AWS::Logs::LogGroup` per function, named `/aws/lambda/${FunctionName}`. That is forty-odd resources and several hundred lines of YAML for a housekeeping task, which fails the value-per-line test badly enough to justify a deliberate exception to the fifth requirement: sweep the existing groups with a one-off `aws logs put-retention-policy` loop, and accept that new functions will need the same sweep again. 30 days for dev and test, 90 for prod.

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

| Option                                    | Verdict                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| More memory (chosen, on a wrong premise)  | Shipped, and the premise was wrong: init did not move at all, and the warm win came from reusing DynamoDB connections rather than from CPU. Harmless and slightly cheaper at this volume, but it is not a lever on cold starts and buying more of it will not help further.                                   |
| Reusing SDK clients across invocations    | The change that actually mattered, though it belongs under warm latency rather than cold starts. Median execution 170ms to 22ms.                                                                                                                                                                              |
| Serving album JSON from S3 via CloudFront | Removes Lambda from the read path entirely — no cold start, no duration, edge-cached, and it lands on the same origin once the domains are consolidated. The most thorough answer; a larger change.                                                                                                           |
| Scheduled keep-warm pings                 | Still rejected: it adds invocations and cost to buy ~490ms on a twentieth of requests. Worth knowing that the interval is load-bearing if anyone revisits it — a five-minute ping keeps the environment alive but still lets the DynamoDB connection lapse (~104ms), while two minutes holds both (~15–20ms). |
| Provisioned concurrency                   | Rejected on cost for a site at this traffic.                                                                                                                                                                                                                                                                  |

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
