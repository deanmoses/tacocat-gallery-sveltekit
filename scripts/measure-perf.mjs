#!/usr/bin/env node
/**
 * Measures how long the gallery takes to become useful, from a real browser against a deployed site.
 *
 * Reports the three segments of the critical path -- shell, album JSON, thumbnails -- so a change can be
 * attributed to the leg it actually moved. Run it before a change and again after.
 *
 * Point it at an album; the run ends when the album's thumbnails have loaded.
 *
 * Usage:
 *   node scripts/measure-perf.mjs                                  # production
 *   node scripts/measure-perf.mjs https://staging-pix.tacocat.com/ # staging
 *   node scripts/measure-perf.mjs https://pix.tacocat.com/2024/    # a specific album
 */

import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'https://pix.tacocat.com/';
const runs = Number(process.argv[3] ?? 5);
const settleTimeoutMs = 30_000;

/** Records the largest-contentful-paint time, which is the closest single number to "the page looks done" */
const observeLcp = () => {
    window.__lcp = 0;
    new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__lcp = entry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
};

/**
 * Cross-origin resources report protocol and size only when the origin sends Timing-Allow-Origin,
 * so those columns read as unknown for the API and image hosts until that header is added.
 */
const collect = () => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const lastByte = (host) =>
        Math.round(Math.max(0, ...resources.filter((r) => r.name.includes(host)).map((r) => r.responseEnd)));
    const hosts = {};
    for (const resource of resources) {
        const host = new URL(resource.name).host;
        hosts[host] ??= { requests: 0, protocols: new Set(), kb: 0 };
        hosts[host].requests++;
        hosts[host].protocols.add(resource.nextHopProtocol || 'unknown');
        hosts[host].kb += (resource.transferSize ?? 0) / 1024;
    }
    return {
        lcp: Math.round(window.__lcp),
        shell: Math.round(nav.loadEventEnd),
        api: lastByte('/api.'),
        images: lastByte('/img.'),
        imageCount: document.querySelectorAll('[data-testid="thumbnail-image"]').length,
        hosts: Object.fromEntries(
            Object.entries(hosts).map(([host, h]) => [
                host,
                { requests: h.requests, protocol: [...h.protocols].join(','), kb: Math.round(h.kb) },
            ]),
        ),
    };
};

async function measureOnce() {
    const browser = await chromium.launch();
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await page.addInitScript(observeLcp);
        await page.goto(url, { waitUntil: 'load' });
        // Thumbnails only exist once the album JSON has arrived and rendered, so waiting for a
        // non-empty set of loaded images is what marks the page useful. A timeout here still
        // yields a usable measurement: the segment times come from the resource timeline.
        await page
            .waitForFunction(
                () => {
                    const thumbnails = [...document.querySelectorAll('[data-testid="thumbnail-image"]')];
                    return thumbnails.length > 0 && thumbnails.every((img) => img.complete);
                },
                { timeout: settleTimeoutMs },
            )
            .catch(() => undefined);
        return await page.evaluate(collect);
    } finally {
        await browser.close();
    }
}

const median = (numbers) => [...numbers].sort((a, b) => a - b)[Math.floor(numbers.length / 2)];

const results = [];
for (let i = 0; i < runs; i++) results.push(await measureOnce());
const at = (key) => median(results.map((r) => r[key]));

const segments = [
    ['Shell (HTML, JS, CSS)', 0, at('shell')],
    ['Album JSON', at('shell'), at('api')],
    [`Thumbnails (${results[0].imageCount})`, at('api'), at('images')],
];

console.log(`\n${url}  --  median of ${runs} runs\n`);
console.log(`  LCP ${at('lcp')}ms      fully settled ${at('images')}ms\n`);
console.table(
    Object.fromEntries(
        segments.map(([name, from, to]) => [
            name,
            { 'starts at': `${from}ms`, 'done at': `${to}ms`, took: `${to - from}ms` },
        ]),
    ),
);
console.table(results[0].hosts);
