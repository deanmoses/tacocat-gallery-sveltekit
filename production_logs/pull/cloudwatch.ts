/**
 * Downloads whole CloudWatch log groups into production_logs/dumps/cloudwatch/<group>/.
 *
 * Every line of every group asked for, unfiltered: the Lambda platform records that say what each invocation cost, the
 * events the handlers log, and the API Gateway access logs. What each line means is the reader's business, so a new
 * kind of line costs nothing here. Rows are the events as `aws logs filter-log-events` hands them down, one ndjson file
 * per UTC day, merged on the event id: a re-pull only ever adds, and pulling mid-day is safe.
 *
 * The group's own retention, read from CloudWatch, bounds how far back a first pull reaches.
 *
 * Needs the aws CLI with credentials for the Tacocat account.
 *
 * Usage:
 *   node production_logs/pull/cloudwatch.ts tacocat-gallery-sam/prod            # newest day in the dump through today
 *   node production_logs/pull/cloudwatch.ts tacocat-gallery-sam/dev --start 2026-09-01
 *   node production_logs/pull/cloudwatch.ts tacocat-gallery-sam/prod tacocat-gallery-sam/prod/api-access
 */

import { execFile } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { parseArgs, promisify } from 'node:util';
import { dayFile, dayStartMs, daysBetween, mergeIntoDayFile, resolveWindow } from './days.ts';
import type { Identity } from './days.ts';

const OUT = path.join(import.meta.dirname, '..', 'dumps', 'cloudwatch');

/** One event as filter-log-events hands it down; `message` is the line as the group holds it, still a string */
export type LogEvent = {
    eventId: string;
    timestamp: number;
    logStreamName: string;
    message: string;
    ingestionTime?: number;
};

/** Time order, then event id, so a re-pull writes the same file */
export const byTime = (a: LogEvent, b: LogEvent): number =>
    a.timestamp - b.timestamp || (a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0);

const EVENT_IDENTITY: Identity<LogEvent> = { key: (event) => event.eventId, order: byTime };

/** A UTC day as filter-log-events takes it: epoch milliseconds, both ends inclusive */
export function dayWindowMs(day: string): [number, number] {
    const start = dayStartMs(day);
    return [start, start + 86_400_000 - 1];
}

/** The events of a whole filter-log-events response, refusing anything else the CLI might have printed */
export function eventsOf(response: unknown): LogEvent[] {
    if (typeof response !== 'object' || response === null || !('events' in response)) {
        throw new Error('expected a filter-log-events response with an events array');
    }
    // The CLI follows every page itself unless told to stop, so a token means the events are not all here.
    if ('nextToken' in response || 'NextToken' in response) {
        throw new Error('filter-log-events returned one page of several; the events are incomplete');
    }
    if (!Array.isArray(response.events)) throw new Error('expected a filter-log-events response with an events array');
    return response.events as LogEvent[];
}

/**
 * The group's retention in days out of a describe-log-groups response. The call takes a prefix, so the response can
 * name more groups than the one asked for; a group that is absent, or that keeps its logs forever, has no number.
 */
export function retentionOf(response: unknown, group: string): number {
    if (typeof response !== 'object' || response === null || !('logGroups' in response)) {
        throw new Error('expected a describe-log-groups response with a logGroups array');
    }
    const groups = response.logGroups as { logGroupName: string; retentionInDays?: number }[];
    const match = groups.find((g) => g.logGroupName === group);
    if (match === undefined) throw new Error(`log group ${group} does not exist`);
    if (match.retentionInDays === undefined) {
        throw new Error(`log group ${group} has no retention set, so there is no default start; pass --start`);
    }
    return match.retentionInDays;
}

const run = promisify(execFile);

async function aws(args: string[]): Promise<unknown> {
    try {
        const { stdout } = await run('aws', ['logs', ...args, '--output', 'json'], {
            encoding: 'utf8',
            maxBuffer: 256 * 1024 * 1024,
        });
        return JSON.parse(stdout);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            throw new Error('aws CLI not on PATH; brew install awscli', { cause: error });
        }
        throw error;
    }
}

async function retentionDays(group: string): Promise<number> {
    return retentionOf(await aws(['describe-log-groups', '--log-group-name-prefix', group]), group);
}

async function filterLogEvents(group: string, [startMs, endMs]: [number, number]): Promise<LogEvent[]> {
    return eventsOf(
        await aws([
            'filter-log-events',
            '--log-group-name',
            group,
            '--start-time',
            String(startMs),
            '--end-time',
            String(endMs),
        ]),
    );
}

async function pullGroup(group: string, asked: { start?: string; end?: string }): Promise<void> {
    const out = path.join(OUT, group);
    const retention = await retentionDays(group);
    const { start, end } = resolveWindow(asked, out, retention);
    mkdirSync(out, { recursive: true });
    for (const day of daysBetween(start, end)) {
        const events = await filterLogEvents(group, dayWindowMs(day));
        if (events.length === 0) {
            console.log(`${group}/${day}: no events; outside the ${retention}-day retention, or nothing logged`);
            continue;
        }
        const { added, total } = mergeIntoDayFile(dayFile(out, day), events, EVENT_IDENTITY);
        console.log(`${group}/${day}: ${added} new events, ${total} total`);
    }
}

async function main(argv: string[]): Promise<void> {
    const { values, positionals } = parseArgs({
        args: argv,
        options: { start: { type: 'string' }, end: { type: 'string' } },
        allowPositionals: true,
    });
    if (positionals.length === 0) {
        console.error('usage: cloudwatch.ts <log group>... [--start YYYY-MM-DD] [--end YYYY-MM-DD]');
        process.exit(1);
    }
    for (const group of positionals) await pullGroup(group, values);
}

// import.meta.main is still Stability 1.0; the alternative, comparing import.meta.url to argv[1],
// is wrong for symlinks and spaces in the path.
// eslint-disable-next-line n/no-unsupported-features/node-builtins
if (import.meta.main) await main(process.argv.slice(2));
