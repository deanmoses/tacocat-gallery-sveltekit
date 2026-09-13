/**
 * Downloads Grafana's synthetic-monitoring check logs into production_logs/dumps/grafana/.
 *
 * The probes hit the SPA and the API every ten minutes from three regions, and the agent writes
 * every execution to Loki as a handful of lines: begin, DNS, request, response, a roundtrip line
 * with every phase timestamp, and a verdict with the duration. That is the per-execution record.
 * The Prometheus metrics republish one execution several times and keep none of the phases.
 *
 * Loki keeps 14 days on the free plan, so an execution not pulled by then is gone. Rows are written
 * as Loki hands them down, one ndjson file per UTC day of the row's own timestamp, merged on
 * timestamp and line: a re-pull only ever adds, and pulling mid-day is safe.
 *
 * Needs GRAFANA_ANALYTICS_TOKEN, a service-account token with the Viewer role, made at
 * tacocorp.grafana.net under Administration > Users and access > Service accounts. Read from the
 * environment, or from a gitignored .env at the repo root.
 *
 * Usage:
 *   node production_logs/pull/grafana.ts                                   # newest day in the dump through today
 *   node production_logs/pull/grafana.ts --start 2026-09-01                # that day through today
 *   node production_logs/pull/grafana.ts --start 2026-09-01 --end 2026-09-03
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const GRAFANA = 'https://tacocorp.grafana.net';
const LOKI_UID = 'grafanacloud-logs';
const QUERY = '{source="synthetic-monitoring-agent"}';
/** Loki's ceiling on entries per query. A page this full may have more behind it. */
export const PAGE = 5000;
/** How far back Loki can answer at all */
const RETENTION_DAYS = 14;
const NS_PER_MS = 1_000_000n;
const NS_PER_DAY = 86_400_000n * NS_PER_MS;
const OUT = path.join(import.meta.dirname, '..', 'dumps', 'grafana', 'synthetic');
const REPO_ROOT = path.join(import.meta.dirname, '..', '..');

export type Labels = Record<string, string>;

/** One log line as Loki hands it down. The timestamp is nanoseconds, kept as text because it does not fit a number. */
export type Row = {
    timestamp: string;
    line: string;
    labels: Labels;
    /** The third element the Loki API documents for structured metadata. Through the Grafana proxy it has never arrived; the execution id comes as a label. */
    metadata: Labels | null;
};

/** The parts of a query_range response this reads */
export type LokiPage = {
    data: {
        resultType: string;
        result: { stream: Labels; values: [string, string, Labels?][] }[];
    };
};

/** Fetches one page of the stream between two nanosecond timestamps, end exclusive */
export type FetchPage = (startNs: bigint, endNs: bigint) => Promise<LokiPage>;

const byTimestamp = (a: Row, b: Row): number => {
    const x = BigInt(a.timestamp);
    const y = BigInt(b.timestamp);
    return x < y ? -1 : x > y ? 1 : 0;
};

/** Every line in a page as a flat, time-ordered list. Loki groups them by label set, which is not an order. */
export function rowsOf(page: LokiPage): Row[] {
    if (page.data.resultType !== 'streams') {
        throw new Error(`expected a streams response, got ${page.data.resultType}`);
    }
    return page.data.result
        .flatMap(({ stream, values }) =>
            values.map(([timestamp, line, metadata]): Row => ({
                timestamp,
                line,
                labels: stream,
                metadata: metadata ?? null,
            })),
        )
        .sort(byTimestamp);
}

/** Row identity for merging: the agent never writes two lines with the same nanosecond and text */
export const rowKey = (row: Row): string => `${row.timestamp}\t${row.line}`;

/** Union on row identity, in time order. What is already on disk is never rewritten. */
export function merge(existing: Row[], incoming: Row[]): Row[] {
    const byKey = new Map(existing.map((row) => [rowKey(row), row]));
    for (const row of incoming) {
        const key = rowKey(row);
        if (!byKey.has(key)) byKey.set(key, row);
    }
    return [...byKey.values()].sort(byTimestamp);
}

/** The UTC day a nanosecond timestamp falls on, as YYYY-MM-DD */
export function dayOf(timestampNs: string): string {
    return new Date(Number(BigInt(timestampNs) / NS_PER_MS)).toISOString().slice(0, 10);
}

export function dayStartNs(day: string): bigint {
    return BigInt(Date.parse(`${day}T00:00:00Z`)) * NS_PER_MS;
}

/** Where the next page starts, or null when this page was the last one */
export function nextStart(rows: Row[]): bigint | null {
    const last = rows.at(-1);
    if (rows.length < PAGE || last === undefined) return null;
    return BigInt(last.timestamp) + 1n;
}

/** Every UTC day from start through end, inclusive */
export function daysBetween(start: string, end: string): string[] {
    const days: string[] = [];
    for (let t = Date.parse(`${start}T00:00:00Z`); t <= Date.parse(`${end}T00:00:00Z`); t += 86_400_000) {
        days.push(new Date(t).toISOString().slice(0, 10));
    }
    return days;
}

/**
 * The window to pull when none is given: from the newest day already on disk, which was short when
 * it was pulled, through today. With nothing on disk, as far back as Loki can answer.
 */
export function defaultWindow(existingDays: string[], today: string): { start: string; end: string } {
    const newest = [...existingDays].sort().at(-1);
    const retentionStart = new Date(Date.parse(`${today}T00:00:00Z`) - RETENTION_DAYS * 86_400_000)
        .toISOString()
        .slice(0, 10);
    return { start: newest ?? retentionStart, end: today };
}

/** One UTC day of the stream, however many pages it takes */
export async function pullDay(day: string, fetchPage: FetchPage): Promise<Row[]> {
    const end = dayStartNs(day) + NS_PER_DAY;
    let start = dayStartNs(day);
    let rows: Row[] = [];
    for (;;) {
        const page = rowsOf(await fetchPage(start, end));
        rows = merge(rows, page);
        const next = nextStart(page);
        if (next === null) return rows;
        start = next;
    }
}

function lokiFetcher(token: string): FetchPage {
    return async (startNs, endNs) => {
        const url = new URL(`${GRAFANA}/api/datasources/proxy/uid/${LOKI_UID}/loki/api/v1/query_range`);
        url.searchParams.set('query', QUERY);
        url.searchParams.set('start', String(startNs));
        url.searchParams.set('end', String(endNs));
        url.searchParams.set('limit', String(PAGE));
        url.searchParams.set('direction', 'forward');
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (!response.ok) {
            const hint = response.status === 401 ? ' (is GRAFANA_ANALYTICS_TOKEN a valid service-account token?)' : '';
            throw new Error(
                `Loki answered ${response.status} ${response.statusText}${hint}: ${(await response.text()).slice(0, 300)}`,
            );
        }
        return (await response.json()) as LokiPage;
    };
}

/** A NAME=value line from the repo's .env, unquoted; undefined when the file or the name is absent */
function fromEnvFile(name: string): string | undefined {
    const envFile = path.join(REPO_ROOT, '.env');
    if (!existsSync(envFile)) return undefined;
    for (const line of readFileSync(envFile, 'utf8').split('\n')) {
        const [key, ...rest] = line.split('=');
        if (key.trim() === name)
            return rest
                .join('=')
                .trim()
                .replace(/^(["'])(.*)\1$/, '$2');
    }
    return undefined;
}

function token(): string {
    const value = process.env.GRAFANA_ANALYTICS_TOKEN ?? fromEnvFile('GRAFANA_ANALYTICS_TOKEN');
    if (value === undefined || value === '') {
        console.error(
            'GRAFANA_ANALYTICS_TOKEN is not set: export it, or put it in .env at the repo root (gitignored).',
        );
        console.error('It is a service-account token with the Viewer role from tacocorp.grafana.net.');
        process.exit(2);
    }
    return value;
}

function readRows(file: string): Row[] {
    if (!existsSync(file)) return [];
    return readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => JSON.parse(line) as Row);
}

function isDay(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

async function main(argv: string[]): Promise<void> {
    const { values } = parseArgs({ args: argv, options: { start: { type: 'string' }, end: { type: 'string' } } });
    const today = new Date().toISOString().slice(0, 10);
    const existing = existsSync(OUT)
        ? readdirSync(OUT)
              .filter((f) => f.endsWith('.ndjson'))
              .map((f) => f.slice(0, 10))
        : [];
    const window = defaultWindow(existing, today);
    const start = values.start ?? window.start;
    const end = values.end ?? window.end;
    if (!isDay(start) || !isDay(end) || start > end) {
        console.error(`usage: --start YYYY-MM-DD [--end YYYY-MM-DD], start no later than end (got ${start}..${end})`);
        process.exit(1);
    }

    const fetchPage = lokiFetcher(token());
    mkdirSync(OUT, { recursive: true });
    for (const day of daysBetween(start, end)) {
        const pulled = await pullDay(day, fetchPage);
        if (pulled.length === 0) {
            console.log(`${day}: nothing in Loki; outside its ${RETENTION_DAYS}-day retention, or not yet`);
            continue;
        }
        // Bucketed by each row's own timestamp rather than the day asked for, so a boundary row
        // lands in the file its day owns.
        const byDay = Map.groupBy(pulled, (row) => dayOf(row.timestamp));
        for (const [rowDay, rows] of byDay) {
            const file = path.join(OUT, `${rowDay}.ndjson`);
            const before = readRows(file);
            const merged = merge(before, rows);
            // Written beside and renamed in, so a kill or a full disk mid-write leaves the
            // day's file as it was rather than truncated. A day past Loki's retention has no
            // other copy.
            writeFileSync(`${file}.tmp`, merged.map((row) => JSON.stringify(row)).join('\n') + '\n');
            renameSync(`${file}.tmp`, file);
            console.log(`${rowDay}: ${merged.length - before.length} new lines, ${merged.length} total`);
        }
    }
}

// import.meta.main is still Stability 1.0; the alternative, comparing import.meta.url to argv[1],
// is wrong for symlinks and spaces in the path.
// eslint-disable-next-line n/no-unsupported-features/node-builtins
if (import.meta.main) await main(process.argv.slice(2));
