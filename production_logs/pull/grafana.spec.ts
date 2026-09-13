import { describe, expect, it } from 'vitest';
import { PAGE, dayOf, merge, nextStart, pullDay, rowsOf } from './grafana.ts';
import type { LokiPage, Row } from './grafana.ts';

/** 2026-09-13T08:54:57.251Z, the nanosecond a real execution began */
const T0 = 1789289697251247853n;

const row = (timestamp: bigint, line = 'msg="Beginning check"', metadata: Row['metadata'] = null): Row => ({
    timestamp: String(timestamp),
    line,
    labels: { job: 'Tacocat SPA', probe: 'Paris' },
    metadata,
});

const page = (
    ...streams: { stream: Record<string, string>; values: [string, string, Record<string, string>?][] }[]
): LokiPage => ({
    data: { resultType: 'streams', result: streams },
});

describe(rowsOf, () => {
    it('flattens every stream into one time-ordered list, keeping the metadata a line carries', () => {
        const rows = rowsOf(
            page(
                {
                    stream: { probe: 'Paris' },
                    values: [
                        [String(T0 + 5n), 'later'],
                        [String(T0), 'first', { execution_id: 'e1' }],
                    ],
                },
                { stream: { probe: 'Ohio' }, values: [[String(T0 + 2n), 'middle']] },
            ),
        );
        expect(rows.map((r) => r.line)).toEqual(['first', 'middle', 'later']);
        expect(rows[0]).toEqual({
            timestamp: String(T0),
            line: 'first',
            labels: { probe: 'Paris' },
            metadata: { execution_id: 'e1' },
        });
        expect(rows[1]?.metadata).toBeNull();
    });

    it('refuses a metric response, which has no lines to keep', () => {
        expect(() => rowsOf({ data: { resultType: 'matrix', result: [] } })).toThrow('matrix');
    });
});

describe(merge, () => {
    it('adds only lines not already on disk, and never reorders what is', () => {
        const onDisk = [row(T0), row(T0 + 1n, 'msg="Resolved"')];
        const merged = merge(onDisk, [row(T0 + 1n, 'msg="Resolved"'), row(T0 - 1n, 'earlier')]);
        expect(merged.map((r) => r.line)).toEqual(['earlier', 'msg="Beginning check"', 'msg="Resolved"']);
    });

    it('treats the same nanosecond with different text as two lines', () => {
        expect(merge([row(T0, 'a')], [row(T0, 'b')])).toHaveLength(2);
    });
});

describe(dayOf, () => {
    it.each([
        { ns: '1789289697251247853', day: '2026-09-13' },
        { ns: '86399999999999', day: '1970-01-01' }, // the last nanosecond of the day
        { ns: '86400000000000', day: '1970-01-02' }, // the first of the next
    ])('$ns falls on $day', ({ ns, day }) => {
        expect(dayOf(ns)).toBe(day);
    });
});

describe(nextStart, () => {
    it('is null for a page with room left, which means Loki had nothing more', () => {
        expect(nextStart([row(T0)])).toBeNull();
        expect(nextStart([])).toBeNull();
    });

    it('starts the next page one nanosecond after a full one', () => {
        const full = Array.from({ length: PAGE }, (_, i) => row(T0 + BigInt(i)));
        expect(nextStart(full)).toBe(T0 + BigInt(PAGE - 1) + 1n);
    });
});

describe(pullDay, () => {
    it('pages until Loki hands back less than a full page, resuming after the last line', async () => {
        const asked: bigint[] = [];
        const full = Array.from({ length: PAGE }, (_, i): [string, string] => [String(T0 + BigInt(i)), `line ${i}`]);
        const fetchPage = (startNs: bigint): Promise<LokiPage> => {
            asked.push(startNs);
            const values = asked.length === 1 ? full : [[String(T0 + BigInt(PAGE)), 'last'] as [string, string]];
            return Promise.resolve(page({ stream: {}, values }));
        };
        const rows = await pullDay('2026-09-13', fetchPage);
        expect(rows).toHaveLength(PAGE + 1);
        expect(asked).toEqual([1789257600000000000n, T0 + BigInt(PAGE - 1) + 1n]);
    });
});
