import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, onTestFinished } from 'vitest';
import { dayFile, daysBetween, daysOnDisk, mergeIntoDayFile, pullWindow } from './days.ts';
import type { Identity, Window } from './days.ts';

type Row = { id: string; at: number };
const IDENTITY: Identity<Row> = { key: (row) => row.id, order: (a, b) => a.at - b.at };

function scratchDir(): string {
    const dir = mkdtempSync(path.join(tmpdir(), 'days-'));
    onTestFinished(() => {
        rmSync(dir, { recursive: true });
    });
    return dir;
}

describe(daysBetween, () => {
    it('is inclusive at both ends and crosses a month', () => {
        expect(daysBetween('2026-08-30', '2026-09-02')).toEqual([
            '2026-08-30',
            '2026-08-31',
            '2026-09-01',
            '2026-09-02',
        ]);
    });
});

type WindowCase = { why: string; asked: { start?: string; end?: string }; existingDays: string[]; window: Window };

const WINDOWS: WindowCase[] = [
    {
        why: 'reaches back to the retention limit when nothing is on disk',
        asked: {},
        existingDays: [],
        window: { start: '2026-08-30', end: '2026-09-13' },
    },
    {
        why: 'resumes from the newest day on disk, which was short',
        asked: {},
        existingDays: ['2026-09-10', '2026-09-12', '2026-09-11'],
        window: { start: '2026-09-12', end: '2026-09-13' },
    },
    {
        why: 'takes what was asked over what is on disk',
        asked: { start: '2026-09-01', end: '2026-09-02' },
        existingDays: ['2026-09-12'],
        window: { start: '2026-09-01', end: '2026-09-02' },
    },
];

describe(pullWindow, () => {
    it.each(WINDOWS)('$why', ({ asked, existingDays, window }) => {
        expect(pullWindow({ asked, existingDays, today: '2026-09-13', retentionDays: 14 })).toEqual(window);
    });

    it.each([
        { why: 'a start after the end', asked: { start: '2026-09-14', end: '2026-09-13' } },
        { why: 'a day that is not zero-padded', asked: { start: '2026-9-1' } },
    ])('refuses $why', ({ asked }) => {
        expect(() => pullWindow({ asked, existingDays: [], today: '2026-09-13', retentionDays: 14 })).toThrow('usage');
    });
});

describe(daysOnDisk, () => {
    it('lists only day files, not a write interrupted beside one', () => {
        const dir = scratchDir();
        for (const f of ['2026-09-12.ndjson', '2026-09-13.ndjson.tmp', 'notes.txt']) {
            writeFileSync(path.join(dir, f), '');
        }
        expect(daysOnDisk(dir)).toEqual(['2026-09-12']);
    });

    it('is empty for a directory nothing has been pulled into', () => {
        expect(daysOnDisk(path.join(scratchDir(), 'never-created'))).toEqual([]);
    });
});

describe(mergeIntoDayFile, () => {
    it('adds only rows not already in the file, keeps it in order, and leaves nothing beside it', () => {
        const dir = scratchDir();
        const file = dayFile(dir, '2026-09-12');
        expect(mergeIntoDayFile(file, [{ id: 'b', at: 2 }], IDENTITY)).toEqual({ added: 1, total: 1 });
        const repull = [
            { id: 'b', at: 2 },
            { id: 'a', at: 1 },
        ];
        expect(mergeIntoDayFile(file, repull, IDENTITY)).toEqual({ added: 1, total: 2 });
        const lines = readFileSync(file, 'utf8').trimEnd().split('\n');
        expect(lines.map((line) => (JSON.parse(line) as Row).id)).toEqual(['a', 'b']);
        expect(readdirSync(dir)).toEqual(['2026-09-12.ndjson']);
    });
});
