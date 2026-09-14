import { describe, expect, it } from 'vitest';
import { byTime, dayWindowMs, eventsOf, retentionOf } from './cloudwatch.ts';
import type { LogEvent } from './cloudwatch.ts';

const event = (eventId: string, timestamp: number): LogEvent => ({
    eventId,
    timestamp,
    logStreamName: '2026/09/12/tacocat-gallery-sam-prod-GetAlbum[$LATEST]a1',
    message: '{"type":"platform.report"}',
});

describe(dayWindowMs, () => {
    it('runs to the last millisecond of the day and not into the next', () => {
        expect(dayWindowMs('2026-09-12')).toEqual([Date.UTC(2026, 8, 12), Date.UTC(2026, 8, 13) - 1]);
    });
});

describe(eventsOf, () => {
    it('returns the events of a whole response', () => {
        expect(eventsOf({ events: [event('1', 5)], searchedLogStreams: [] })).toEqual([event('1', 5)]);
    });

    it.each([
        { why: 'something that is not a response', response: 'An error occurred' },
        { why: 'a response without events', response: { searchedLogStreams: [] } },
        {
            why: 'one page of several, which the CLI returns only when told to stop',
            response: { events: [], NextToken: 'x' },
        },
    ])('refuses $why', ({ response }) => {
        expect(() => eventsOf(response)).toThrow('filter-log-events');
    });
});

describe(retentionOf, () => {
    const response = {
        logGroups: [
            { logGroupName: 'tacocat-gallery-sam/prod', retentionInDays: 90 },
            { logGroupName: 'tacocat-gallery-sam/prod/api-access', retentionInDays: 90 },
            { logGroupName: 'tacocat-gallery-sam/prod/forever' },
        ],
    };

    it('picks the group asked for out of everything sharing its prefix', () => {
        expect(retentionOf(response, 'tacocat-gallery-sam/prod')).toBe(90);
    });

    it.each([
        { why: 'a group that does not exist', group: 'tacocat-gallery-sam/nope', error: 'does not exist' },
        { why: 'a group that keeps logs forever', group: 'tacocat-gallery-sam/prod/forever', error: 'pass --start' },
    ])('refuses $why', ({ group, error }) => {
        expect(() => retentionOf(response, group)).toThrow(error);
    });
});

describe(byTime, () => {
    it('orders by timestamp, then by event id', () => {
        const sorted = [event('b', 2), event('c', 1), event('a', 2)].sort(byTime);
        expect(sorted.map((e) => e.eventId)).toEqual(['c', 'a', 'b']);
    });
});
