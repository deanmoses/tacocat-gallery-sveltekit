import { describe, expect, it } from 'vitest';
import { fakeServer, jsonResponse } from '$lib/test-support/http';
import { AUTH_STATUS_HEADER, fetchRefreshingSession, refreshSession } from './session';

/** Under node the auth service resolves to the production hostname; the fake server keys on pathname alone */
const AUTH_ROUTE = '/';
const ALBUM_ROUTE = '/album/2001/12-31/';
const ALBUM_URL = `https://api.pix.tacocat.com${ALBUM_ROUTE}`;

const unauthorized = (): Response => new Response(null, { status: 401 });
const albumReply = (status: string | undefined, body: unknown): Response =>
    jsonResponse(body, 200, status ? { [AUTH_STATUS_HEADER]: status } : {});

describe(refreshSession, () => {
    it.each([
        {
            outcome: 'true when the auth service refreshed the cookies',
            reply: jsonResponse({ user: 'x' }),
            expected: true,
        },
        { outcome: 'false when the session has expired', reply: unauthorized(), expected: false },
        {
            outcome: 'false when the auth service cannot be reached',
            reply: () => {
                throw new Error('offline');
            },
            expected: false,
        },
    ])('is $outcome', async ({ reply, expected }) => {
        const server = fakeServer();
        server.get(AUTH_ROUTE, reply);

        await expect(refreshSession()).resolves.toBe(expected);
    });

    it('shares one request between concurrent callers', async () => {
        const server = fakeServer();
        server.get(AUTH_ROUTE, jsonResponse({ user: 'x' }));

        await expect(Promise.all([refreshSession(), refreshSession()])).resolves.toStrictEqual([true, true]);

        expect(server.calls).toHaveLength(1);
    });

    it('asks again once the previous request has settled', async () => {
        const server = fakeServer();
        server.get(AUTH_ROUTE, jsonResponse({ user: 'x' }));

        await refreshSession();
        await refreshSession();

        expect(server.calls).toHaveLength(2);
    });
});

describe(fetchRefreshingSession, () => {
    it.each([
        { verdict: 'no auth cookie', status: undefined },
        { verdict: 'a valid token', status: 'valid' },
    ])('takes the first answer when the server saw $verdict', async ({ status }) => {
        const server = fakeServer();
        server.get(ALBUM_ROUTE, albumReply(status, { view: 'first' }));

        const response = await fetchRefreshingSession(ALBUM_URL, {});

        await expect(response.json()).resolves.toStrictEqual({ view: 'first' });
        expect(server.calls.map((c) => c.pathname)).toStrictEqual([ALBUM_ROUTE]);
    });

    it('refreshes the session and asks again when the server could not verify the token', async () => {
        const server = fakeServer();
        server.get(ALBUM_ROUTE, albumReply('invalid', { view: 'guest' }), albumReply('valid', { view: 'admin' }));
        server.get(AUTH_ROUTE, jsonResponse({ user: 'x' }));

        const response = await fetchRefreshingSession(ALBUM_URL, {});

        await expect(response.json()).resolves.toStrictEqual({ view: 'admin' });
        expect(server.calls.map((c) => c.pathname)).toStrictEqual([ALBUM_ROUTE, AUTH_ROUTE, ALBUM_ROUTE]);
    });

    it('keeps the public view when the session cannot be refreshed', async () => {
        const server = fakeServer();
        server.get(ALBUM_ROUTE, albumReply('invalid', { view: 'guest' }));
        server.get(AUTH_ROUTE, unauthorized());

        const response = await fetchRefreshingSession(ALBUM_URL, {});

        await expect(response.json()).resolves.toStrictEqual({ view: 'guest' });
        expect(server.calls.map((c) => c.pathname)).toStrictEqual([ALBUM_ROUTE, AUTH_ROUTE]);
    });

    it('asks again only once, even if the second answer is no better', async () => {
        const server = fakeServer();
        server.get(ALBUM_ROUTE, albumReply('invalid', { view: 'guest' }));
        server.get(AUTH_ROUTE, jsonResponse({ user: 'x' }));

        await fetchRefreshingSession(ALBUM_URL, {});

        expect(server.calls.map((c) => c.pathname)).toStrictEqual([ALBUM_ROUTE, AUTH_ROUTE, ALBUM_ROUTE]);
    });
});
