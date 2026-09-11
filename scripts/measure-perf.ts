/**
 * Measures how long the gallery takes to become useful, from a real browser against a deployed site.
 *
 * Reports the three segments of the critical path -- shell, album JSON, thumbnails -- so a change can be
 * attributed to the leg it actually moved. Run it before a change and again after.
 *
 * Every figure prints the spread behind its median. Check that the spread is smaller than the difference
 * before believing the difference: the segment times hold to a few ms across runs, LCP moves by tens.
 *
 * The medians describe a visit that arrives to a warm edge and a warm Lambda, which at this traffic
 * most visits do not. The first run is reported beside them for that reason -- see `firstVisitCost`.
 *
 * Point it at an album; the run ends when the thumbnails a visitor can actually see have loaded.
 *
 * It cannot see resource hints. The headless Chromium behind this script does not act on
 * `preconnect`, so a change involving one measures as no change at all -- four experiments here
 * concluded the hints in app.html were worthless before Lighthouse, driving a real Chrome, showed
 * they were not. Treat any "no effect" from this tool as a question for a real browser.
 *
 * Usage:
 *   node scripts/measure-perf.ts                                  # production
 *   node scripts/measure-perf.ts https://staging-pix.tacocat.com/ # staging
 *   node scripts/measure-perf.ts https://pix.tacocat.com/2024/    # a specific album
 */

import { chromium } from '@playwright/test';

/** One entry of the browser's resource timeline, narrowed to the fields the arithmetic reads */
export type Resource = {
    name: string;
    responseEnd: number;
    /** Empty when the origin sends no Timing-Allow-Origin, which is why it reads as a string */
    protocol: string;
    bytes: number;
};

/** What one visit reports back */
export type Sample = {
    lcp: number;
    shell: number;
    thumbnailCount: number;
    onScreenThumbnailUrls: string[];
    resources: Resource[];
};

/** The legs a run is summarised by. Naming them is what makes a series total rather than a bag. */
export type Metric = 'lcp' | 'shell' | 'api' | 'thumbnails';

export type Series = Record<Metric, number[]>;

/** One metric's cold first run beside the warm median it is judged against */
export type Cost = { cold: number; warm: number };

export type HostRow = { requests: number; protocol: string; kb: number };

declare global {
    // Declaration merging is what puts these on the real Window, and only an interface merges.
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Window {
        __lcp: number;
        __thumbnails: () => HTMLImageElement[];
        __onScreenThumbnails: () => HTMLImageElement[];
    }
}

const settleTimeoutMs = 30_000;
const viewport = { width: 1440, height: 900 };

// ---------------------------------------------------------------------------
// Gathering, in the browser
// ---------------------------------------------------------------------------

/**
 * Installed before any page script runs. Everything the browser side needs lives here, because the
 * wait and the sample have to agree on which thumbnails are on screen, and each is serialized into
 * the page separately with no access to this module.
 */
const installProbe = (): void => {
    window.__lcp = 0;
    new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__lcp = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    window.__thumbnails = () => [...document.querySelectorAll<HTMLImageElement>('[data-testid="thumbnail-image"]')];
    window.__onScreenThumbnails = () =>
        window.__thumbnails().filter((img) => {
            const box = img.getBoundingClientRect();
            return box.top < window.innerHeight && box.bottom > 0;
        });
};

/** Gathers facts; node does the arithmetic */
const collect = (): Sample => {
    // getEntriesByType is typed as returning the base PerformanceEntry, so each call has to say
    // which timeline it asked for.
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return {
        lcp: Math.round(window.__lcp),
        shell: Math.round(nav.loadEventEnd),
        thumbnailCount: window.__thumbnails().length,
        onScreenThumbnailUrls: [...new Set(window.__onScreenThumbnails().map((img) => img.src))],
        resources: resources.map((resource) => ({
            name: resource.name,
            responseEnd: resource.responseEnd,
            protocol: resource.nextHopProtocol,
            bytes: resource.transferSize,
        })),
    };
};

// ---------------------------------------------------------------------------
// Interpreting, in node
// ---------------------------------------------------------------------------

export const median = (numbers: number[]): number => {
    if (0 === numbers.length) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
};

export const spread = (numbers: number[]): { min: number; max: number } =>
    0 === numbers.length ? { min: 0, max: 0 } : { min: Math.min(...numbers), max: Math.max(...numbers) };

/** When the last byte arrived of whichever resources `matches` picks out */
export const lastByte = (resources: Resource[], matches: (resource: Resource) => boolean): number =>
    Math.round(Math.max(0, ...resources.filter(matches).map((resource) => resource.responseEnd)));

export const fromHost =
    (marker: string) =>
    (resource: Resource): boolean =>
        resource.name.includes(marker);

/**
 * Only the thumbnails inside the opening viewport count toward the segment.
 *
 * Timing every thumbnail in the album makes the number depend on how many the album happens to have
 * below the fold, and it collapses of its own accord the moment the grid loads offscreen images
 * lazily -- a drop that reads as a large win without anything having got faster for the person
 * looking at the page.
 */
export const thumbnailsDoneAt = (sample: Sample): number => {
    const onScreen = new Set(sample.onScreenThumbnailUrls);
    return lastByte(sample.resources, (resource) => onScreen.has(resource.name));
};

export const seriesOf = (samples: Sample[]): Series => ({
    lcp: samples.map((sample) => sample.lcp),
    shell: samples.map((sample) => sample.shell),
    api: samples.map((sample) => lastByte(sample.resources, fromHost('/api.'))),
    thumbnails: samples.map(thumbnailsDoneAt),
});

/**
 * The first run's figures beside the warm median, per metric.
 *
 * Every run launches its own browser, so the client is cold in all of them; what the later runs
 * inherit is server-side, an edge cache and a Lambda execution environment the run before them left
 * warm. Production arrives too sparsely for most visits to inherit either -- roughly three quarters
 * of `GetAlbum` arrivals init from cold -- so the first run is the closer analogue of a real visit.
 * One sample cannot carry a median, which is why this reports it beside the warm figures rather
 * than in place of them.
 *
 * It is only cold if the site itself was idle beforehand. Two invocations of this script a few
 * minutes apart leave the second one's first run inheriting the first one's warmth, and it then
 * reads faster than the medians it is compared against.
 */
export const firstVisitCost = (firstSample: Sample, warmSeries: Series): Record<Metric, Cost> => {
    const first = seriesOf([firstSample]);
    // Read off the series rather than a list of its own, so a metric added to `Metric` reaches the
    // comparison without being named twice.
    const metrics = Object.keys(warmSeries) as Metric[];
    // fromEntries types its result by the key type alone, so it cannot express that these entries
    // cover the union; the assertion says what the line above it already guarantees.
    return Object.fromEntries(
        metrics.map((metric): [Metric, Cost] => [metric, { cold: first[metric][0], warm: median(warmSeries[metric]) }]),
    ) as Record<Metric, Cost>;
};

export const hostSummary = (resources: Resource[]): Record<string, HostRow> => {
    const hosts = new Map<string, { requests: number; protocols: Set<string>; kb: number }>();
    for (const resource of resources) {
        const host = new URL(resource.name).host;
        const tally = hosts.get(host) ?? { requests: 0, protocols: new Set<string>(), kb: 0 };
        tally.requests++;
        tally.protocols.add('' === resource.protocol ? 'unknown' : resource.protocol);
        tally.kb += resource.bytes / 1024;
        hosts.set(host, tally);
    }
    return Object.fromEntries(
        [...hosts].map(([host, tally]): [string, HostRow] => [
            host,
            { requests: tally.requests, protocol: [...tally.protocols].join(','), kb: Math.round(tally.kb) },
        ]),
    );
};

// ---------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------

async function measureOnce(url: string): Promise<Sample> {
    const browser = await chromium.launch();
    try {
        const page = await browser.newPage({ viewport });
        await page.addInitScript(installProbe);
        await page.goto(url, { waitUntil: 'load' });
        // Thumbnails only exist once the album JSON has arrived and rendered, so waiting for a
        // non-empty set of loaded images is what marks the page useful. A timeout here still
        // yields a usable measurement: the segment times come from the resource timeline.
        await page
            .waitForFunction(
                () => {
                    const onScreen = window.__onScreenThumbnails();
                    return onScreen.length > 0 && onScreen.every((img) => img.complete);
                },
                { timeout: settleTimeoutMs },
            )
            .catch(() => undefined);
        return await page.evaluate(collect);
    } finally {
        await browser.close();
    }
}

const withSpread = (numbers: number[]): string => {
    const { min, max } = spread(numbers);
    return `${median(numbers)}ms (${min}-${max})`;
};

async function main(url: string, runs: number): Promise<void> {
    // The first run is held out of the median rather than folded into it: repeated runs warm the
    // CDN and the Lambda, so an "after" taken later in a session would beat a "before" taken
    // earlier whether or not anything improved. It is still reported, because it is the run a
    // visitor is most likely to get.
    const samples: Sample[] = [];
    for (let i = 0; i < runs + 1; i++) samples.push(await measureOnce(url));
    const [firstVisit, ...warm] = samples;

    const series = seriesOf(warm);
    const at = (key: Metric): number => median(series[key]);

    const segments: [string, number, number, number[]][] = [
        ['Shell (HTML, JS, CSS)', 0, at('shell'), series.shell],
        ['Album JSON', at('shell'), at('api'), series.api],
        ['Thumbnails on screen', at('api'), at('thumbnails'), series.thumbnails],
    ];

    console.log(`\n${url}  --  median of ${runs} warm runs, plus one cold first visit\n`);
    console.log(`  LCP ${withSpread(series.lcp)}      settled ${withSpread(series.thumbnails)}`);
    console.log(`  ${warm[0].onScreenThumbnailUrls.length} of ${warm[0].thumbnailCount} thumbnails are on screen\n`);
    console.table(
        Object.fromEntries(
            segments.map(([name, from, to, done]) => [
                name,
                {
                    'starts at': `${from}ms`,
                    'done at': `${to}ms`,
                    took: `${to - from}ms`,
                    'spread of done at': `${spread(done).min}-${spread(done).max}ms`,
                },
            ]),
        ),
    );
    const cost = firstVisitCost(firstVisit, series);
    const signed = (n: number): string => (n < 0 ? `${n}` : `+${n}`);
    const against = (label: string, metric: Metric): string =>
        `${label} ${cost[metric].cold}ms (${signed(cost[metric].cold - cost[metric].warm)})`;
    console.log('\n  First visit (one run; cold only if the site was idle -- a negative figure means it was not):');
    // Shell is here to tell a cold edge from a cold Lambda: the album leg moves for either.
    console.log(
        `    ${against('shell', 'shell')}   ${against('album JSON', 'api')}   ` +
            `${against('settled', 'thumbnails')}   ${against('LCP', 'lcp')}`,
    );

    // Not the page's total weight: the run stops when the on-screen thumbnails settle, so this is
    // what the visitor had paid for by the time the page looked done.
    console.log('\n  Loaded by the time the page looked done:');
    console.table(hostSummary(warm[0].resources));
}

// import.meta.main is still Stability 1.0. Worth the risk for a dev tool: the alternative,
// comparing import.meta.url to argv[1], is wrong in the ways that matter here -- symlinks,
// and spaces in the path.
// eslint-disable-next-line n/no-unsupported-features/node-builtins
if (import.meta.main) await main(process.argv[2] ?? 'https://pix.tacocat.com/', Number(process.argv[3] ?? 5));
