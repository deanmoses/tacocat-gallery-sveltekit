import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clear as clearDisk } from 'idb-keyval';
import { fakeServer, jsonResponse } from '$lib/test-support/http';

// Under vitest `dev` is true, which makes the store fake an admin without asking the server
vi.mock(import('$app/environment'), () => ({ dev: false, browser: false }));

/** Under node the auth service resolves to the production hostname; the fake server keys on pathname alone */
const AUTH_ROUTE = '/';

/**
 * The store is a module singleton with no reset, so each test imports a fresh
 * instance. The session helper is imported alongside it so the two share one
 * module graph, which is what the dedupe test is about.
 */
async function freshModules() {
    vi.resetModules();
    const [{ sessionStore }, { refreshSession }] = await Promise.all([
        import('./SessionStore.svelte'),
        import('$lib/utils/session'),
    ]);
    return { sessionStore, refreshSession };
}

/**
 * Covers only the service side: the state transitions are private and the
 * store's public surface is its derived fields.
 */
describe('sessionStore', () => {
    beforeEach(async () => {
        await clearDisk();
    });

    describe('fetchUserStatus', () => {
        it('marks the user an admin when the auth service knows them', async () => {
            const { sessionStore } = await freshModules();
            const server = fakeServer();
            server.get(AUTH_ROUTE, jsonResponse({ user: 'admin' }));

            sessionStore.fetchUserStatus();

            await vi.waitFor(() => expect(sessionStore.isAdmin).toBe(true));

            expect(sessionStore.isCheckingAuth).toBe(false);
        });

        it('marks the user a guest on a 401', async () => {
            const { sessionStore } = await freshModules();
            const server = fakeServer();
            server.get(AUTH_ROUTE, new Response(null, { status: 401 }));

            sessionStore.fetchUserStatus();

            await vi.waitFor(() => expect(sessionStore.isCheckingAuth).toBe(false));

            expect(sessionStore.isAdmin).toBe(false);
        });

        /**
         * On page load this check and an album fetch's session refresh can
         * both be in flight. Two requests would spend a rotating refresh
         * token twice, and the loser would log the session out.
         */
        it('shares its request with a session refresh in flight at the same time', async () => {
            const { sessionStore, refreshSession } = await freshModules();
            const server = fakeServer();
            server.get(AUTH_ROUTE, jsonResponse({ user: 'admin' }));

            sessionStore.fetchUserStatus();

            await expect(refreshSession()).resolves.toBe(true);

            await vi.waitFor(() => expect(sessionStore.isAdmin).toBe(true));

            expect(server.calls).toHaveLength(1);
        });
    });
});
