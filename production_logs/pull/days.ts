/**
 * The dump layout every API puller shares: one ndjson file per UTC day of the rows' own timestamps, merged on row
 * identity so a re-pull only ever adds, and a default window that resumes from the newest day on disk.
 */

import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const MS_PER_DAY = 86_400_000;

export type Window = { start: string; end: string };

/** What makes two rows the same row, and the order a day file keeps them in */
export type Identity<T> = { key: (row: T) => string; order: (a: T, b: T) => number };

/** Every UTC day from start through end, inclusive */
export function daysBetween(start: string, end: string): string[] {
    const days: string[] = [];
    for (let t = dayStartMs(start); t <= dayStartMs(end); t += MS_PER_DAY) {
        days.push(dayOfMs(t));
    }
    return days;
}

// Round-tripped rather than checked for NaN, because Date.parse normalises a
// day the month does not have: February 30th parses as March 2nd.
function isDay(value: string): boolean {
    const ms = dayStartMs(value);
    return !Number.isNaN(ms) && dayOfMs(ms) === value;
}

/** The UTC day a millisecond epoch falls on, as YYYY-MM-DD */
function dayOfMs(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
}

export function dayStartMs(day: string): number {
    return Date.parse(`${day}T00:00:00Z`);
}

/**
 * What was asked, filled in from the dump: the start defaults to the newest day already on disk, which was short when
 * it was pulled, or with nothing on disk to as far back as the source keeps; the end defaults to today.
 */
export function pullWindow(options: {
    asked: { start?: string; end?: string };
    existingDays: string[];
    today: string;
    retentionDays: number;
}): Window {
    const { asked, existingDays, today, retentionDays } = options;
    const newest = [...existingDays].sort().at(-1);
    const start = asked.start ?? newest ?? dayOfMs(dayStartMs(today) - retentionDays * MS_PER_DAY);
    const end = asked.end ?? today;
    if (!isDay(start) || !isDay(end) || start > end) {
        throw new Error(`usage: --start YYYY-MM-DD [--end YYYY-MM-DD], start no later than end (got ${start}..${end})`);
    }
    return { start, end };
}

/** pullWindow over a puller's own arguments and dump directory, as of now. A bad window is a usage error. */
export function resolveWindow(asked: { start?: string; end?: string }, dir: string, retentionDays: number): Window {
    const today = dayOfMs(Date.now());
    try {
        return pullWindow({ asked, existingDays: daysOnDisk(dir), today, retentionDays });
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return process.exit(1);
    }
}

/** Union on row identity, in identity order. What is already on disk is never rewritten. */
export function mergeBy<T>(existing: T[], incoming: T[], { key, order }: Identity<T>): T[] {
    const byKey = new Map(existing.map((row) => [key(row), row]));
    for (const row of incoming) {
        const k = key(row);
        if (!byKey.has(k)) byKey.set(k, row);
    }
    return [...byKey.values()].sort(order);
}

/** The days a dump directory holds a file for */
export function daysOnDisk(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.ndjson$/.test(f))
        .map((f) => f.slice(0, 10));
}

export function dayFile(dir: string, day: string): string {
    return path.join(dir, `${day}.ndjson`);
}

function readDayFile<T>(file: string): T[] {
    if (!existsSync(file)) return [];
    return readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => JSON.parse(line) as T);
}

/**
 * Merges rows into a day file and reports how many were new. Written beside and renamed in, so a kill or a full disk
 * mid-write leaves the file as it was rather than truncated: a day past the source's retention has no other copy.
 */
export function mergeIntoDayFile<T>(file: string, rows: T[], identity: Identity<T>): { added: number; total: number } {
    const before = readDayFile<T>(file);
    const merged = mergeBy(before, rows, identity);
    writeFileSync(`${file}.tmp`, merged.map((row) => JSON.stringify(row)).join('\n') + '\n');
    renameSync(`${file}.tmp`, file);
    return { added: merged.length - before.length, total: merged.length };
}
