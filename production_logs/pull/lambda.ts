/**
 * Downloads the Lambda platform reports of the tacocat-gallery-sam stack into production_logs/dumps/lambda/<env>/.
 *
 * Lambda ends every invocation with a platform.report record: duration, memory, and on a cold start how long the
 * execution environment took to initialise. The API handlers log nothing of their own on a successful read, so these
 * are the only record of how often a request waited for a Lambda to start. Beside them it keeps each request_received
 * line, which is how GenerateDerivedImage names the image it was asked to resize. Every function in the stack logs to
 * one group, `tacocat-gallery-sam/<env>`, which keeps 90 days in prod and 30 in dev.
 *
 * Rows are the events as `aws logs filter-log-events` hands them down, one ndjson file per UTC day, merged on the
 * event id: a re-pull only ever adds, and pulling mid-day is safe.
 *
 * Needs the aws CLI with credentials for the Tacocat account.
 *
 * Usage:
 *   node production_logs/pull/lambda.ts                                  # prod, newest day in the dump through today
 *   node production_logs/pull/lambda.ts --env dev --start 2026-09-01     # staging, that day through today
 */

import { execFile } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { parseArgs, promisify } from 'node:util';
import { dayFile, dayStartMs, daysBetween, mergeIntoDayFile, resolveWindow } from './days.ts';
import type { Identity } from './days.ts';

/** What CloudWatch keeps, per the log group's retention in the stack's template */
const RETENTION_DAYS = { prod: 90, dev: 30 };
type Env = keyof typeof RETENTION_DAYS;
// A handler's logged object has reached CloudWatch both as an object and serialised to a string, so the request line
// is matched both ways.
const FILTER =
    '{ $.type = "platform.report" || $.message.event = "request_received" || $.message = "*request_received*" }';
const OUT = path.join(import.meta.dirname, '..', 'dumps', 'lambda');

/** One event as filter-log-events hands it down; `message` is Lambda's JSON record, still a string */
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

const isEnv = (value: string): value is Env => Object.hasOwn(RETENTION_DAYS, value);

const run = promisify(execFile);

async function filterLogEvents(logGroup: string, [startMs, endMs]: [number, number]): Promise<unknown> {
    try {
        const { stdout } = await run(
            'aws',
            [
                'logs',
                'filter-log-events',
                '--log-group-name',
                logGroup,
                '--start-time',
                String(startMs),
                '--end-time',
                String(endMs),
                '--filter-pattern',
                FILTER,
                '--output',
                'json',
            ],
            { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
        );
        return JSON.parse(stdout);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            throw new Error('aws CLI not on PATH; brew install awscli', { cause: error });
        }
        throw error;
    }
}

async function main(argv: string[]): Promise<void> {
    const { values } = parseArgs({
        args: argv,
        options: { env: { type: 'string', default: 'prod' }, start: { type: 'string' }, end: { type: 'string' } },
    });
    const { env } = values;
    if (!isEnv(env)) {
        console.error(`usage: --env prod|dev (got ${env})`);
        process.exit(1);
    }
    const out = path.join(OUT, env);
    const { start, end } = resolveWindow(values, out, RETENTION_DAYS[env]);
    mkdirSync(out, { recursive: true });
    for (const day of daysBetween(start, end)) {
        const events = eventsOf(await filterLogEvents(`tacocat-gallery-sam/${env}`, dayWindowMs(day)));
        if (events.length === 0) {
            console.log(
                `${env}/${day}: no reports; outside the ${RETENTION_DAYS[env]}-day retention, or no invocations`,
            );
            continue;
        }
        const { added, total } = mergeIntoDayFile(dayFile(out, day), events, EVENT_IDENTITY);
        console.log(`${env}/${day}: ${added} new reports, ${total} total`);
    }
}

// import.meta.main is still Stability 1.0; the alternative, comparing import.meta.url to argv[1],
// is wrong for symlinks and spaces in the path.
// eslint-disable-next-line n/no-unsupported-features/node-builtins
if (import.meta.main) await main(process.argv.slice(2));
