import { describe, expect, it } from 'vitest';
import { firstVisitCost, hostSummary, lastByte, median, seriesOf, spread, thumbnailsDoneAt } from './measure-perf.mjs';

const IMG = 'https://img.pix.tacocat.com/i';

/** A resource timeline entry, with only the fields the arithmetic reads */
const resource = (name, responseEnd, { protocol = 'h2', bytes = 0 } = {}) => ({
    name,
    responseEnd,
    protocol,
    bytes,
});

/**
 * An album of `total` thumbnails of which the first `onScreen` are in the opening viewport, each
 * arriving 10ms after the last. The offscreen ones therefore always finish later than the visible
 * ones, which is the case the segment has to not be fooled by.
 */
const album = ({ total, onScreen }) => {
    const urls = Array.from({ length: total }, (_, i) => `${IMG}/photo${i}.jpg`);
    return {
        lcp: 700,
        shell: 140,
        thumbnailCount: total,
        onScreenThumbnailUrls: urls.slice(0, onScreen),
        resources: [
            resource('https://api.pix.tacocat.com/album/', 460),
            ...urls.map((url, i) => resource(url, 500 + 10 * (i + 1))),
        ],
    };
};

describe(median, () => {
    it.each([
        { numbers: [5, 1, 3], expected: 3 },
        { numbers: [3], expected: 3 },
        { numbers: [], expected: 0 },
        // Sorted numerically, not as strings, or 9 lands above 10
        { numbers: [10, 9, 100], expected: 10 },
    ])('$numbers has median $expected', ({ numbers, expected }) => {
        expect(median(numbers)).toBe(expected);
    });

    it('leaves its argument alone', () => {
        const numbers = [3, 1, 2];
        median(numbers);
        expect(numbers).toEqual([3, 1, 2]);
    });
});

describe(spread, () => {
    it.each([
        { numbers: [668, 736, 688], expected: { min: 668, max: 736 } },
        { numbers: [500], expected: { min: 500, max: 500 } },
        { numbers: [], expected: { min: 0, max: 0 } },
    ])('$numbers spans $expected', ({ numbers, expected }) => {
        expect(spread(numbers)).toEqual(expected);
    });
});

describe(lastByte, () => {
    it('reports when the last matching resource finished', () => {
        const resources = [resource('a', 100), resource('b', 300), resource('c', 200)];
        expect(lastByte(resources, (r) => 'c' !== r.name)).toBe(300);
    });

    it('reports 0 rather than -Infinity when nothing matches', () => {
        expect(lastByte([resource('a', 100)], () => false)).toBe(0);
    });
});

describe(thumbnailsDoneAt, () => {
    it('ignores thumbnails below the fold', () => {
        // 65 thumbnails finish at 1150ms; the 17 on screen finish at 670ms
        expect(thumbnailsDoneAt(album({ total: 65, onScreen: 17 }))).toBe(670);
    });

    it('gives the same answer whether or not the offscreen ones were ever requested', () => {
        const eager = album({ total: 65, onScreen: 17 });
        const lazy = {
            ...eager,
            resources: eager.resources.filter(
                (r) => eager.onScreenThumbnailUrls.includes(r.name) || !r.name.startsWith(IMG),
            ),
        };
        expect(thumbnailsDoneAt(lazy)).toBe(thumbnailsDoneAt(eager));
    });

    it('reports 0 for an album whose thumbnails have not arrived', () => {
        expect(thumbnailsDoneAt(album({ total: 0, onScreen: 0 }))).toBe(0);
    });
});

describe(seriesOf, () => {
    it('collects one figure per sample per metric', () => {
        const samples = [album({ total: 4, onScreen: 2 }), album({ total: 4, onScreen: 2 })];
        expect(seriesOf(samples)).toEqual({
            lcp: [700, 700],
            shell: [140, 140],
            api: [460, 460],
            thumbnails: [520, 520],
        });
    });
});

describe(firstVisitCost, () => {
    /** The first run finishes `slower` ms behind every figure in the warm album */
    const slowerBy = (slower) => {
        const warm = album({ total: 4, onScreen: 2 });
        return {
            ...warm,
            lcp: warm.lcp + slower,
            shell: warm.shell + slower,
            resources: warm.resources.map((r) => ({ ...r, responseEnd: r.responseEnd + slower })),
        };
    };

    it('pairs the single first-run figure with the median of the warm runs', () => {
        const warm = [album({ total: 4, onScreen: 2 }), album({ total: 4, onScreen: 2 })];
        expect(firstVisitCost(slowerBy(400), seriesOf(warm))).toEqual({
            lcp: { cold: 1100, warm: 700 },
            shell: { cold: 540, warm: 140 },
            api: { cold: 860, warm: 460 },
            thumbnails: { cold: 920, warm: 520 },
        });
    });

    it('reports every metric the warm series carries, so none is silently dropped', () => {
        const series = seriesOf([album({ total: 4, onScreen: 2 })]);
        expect(Object.keys(firstVisitCost(slowerBy(0), series))).toEqual(Object.keys(series));
    });

    it('does not fold the first run into the warm figures it is compared against', () => {
        const series = seriesOf([album({ total: 4, onScreen: 2 })]);
        expect(firstVisitCost(slowerBy(400), series).lcp.warm).toBe(700);
    });
});

describe(hostSummary, () => {
    it('groups requests, protocols and bytes by host', () => {
        expect(
            hostSummary([
                resource('https://pix.tacocat.com/app.js', 100, { protocol: 'h3', bytes: 2048 }),
                resource('https://pix.tacocat.com/app.css', 110, { protocol: 'h2', bytes: 1024 }),
                resource(`${IMG}/photo0.jpg`, 500, { bytes: 11561 }),
            ]),
        ).toEqual({
            'pix.tacocat.com': { requests: 2, protocol: 'h3,h2', kb: 3 },
            'img.pix.tacocat.com': { requests: 1, protocol: 'h2', kb: 11 },
        });
    });

    it('says unknown for a cross-origin resource whose origin sends no Timing-Allow-Origin', () => {
        expect(hostSummary([resource('https://api.pix.tacocat.com/album/', 460, { protocol: '' })])).toEqual({
            'api.pix.tacocat.com': { requests: 1, protocol: 'unknown', kb: 0 },
        });
    });
});
