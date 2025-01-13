/**
 * A Svelte store representing the current user / session
 */

import { writable, type Writable, derived, type Readable } from 'svelte/store';
import { dev } from '$app/environment';
import { checkAuthenticationUrl } from '$lib/utils/config';

/** True: simulate being an admin when in a dev (localhost) environment */
const FAKE_ADMIN_ON_DEV = true;

/**
 * Manages the Svelte stores about a user session
 */
class SessionStore {
    /**
     * A writable Svelte store holding whether the user is an admin
     */
    #isAdmin: Writable<boolean> = writable(false);

    /**
     * @returns a read-only Svelte store that says whether the current user is an admin
     */
    isAdmin(): Readable<boolean> {
        return derived(this.#isAdmin, ($isAdmin) => $isAdmin);
    }

    /**
     * Fetch current user's status from server
     */
    async fetchUserStatus(): Promise<void> {
        const fakeAdmin: boolean = FAKE_ADMIN_ON_DEV && dev;
        if (fakeAdmin) {
            console.warn('FAKE: setting user to be an admin');
            this.#isAdmin.set(true);
        } else {
            const response = await fetch(checkAuthenticationUrl(), {
                // no-store: the browser fetches from the remote server without first looking in the cache,
                // and will not update the cache with the downloaded resource
                cache: 'no-store',
                credentials: 'include',
            });
            if (401 === response.status) {
                return;
            }
            this.#handleErrors(response);
            const json = await response.json();
            const isAdmin = !!json.user;
            if (isAdmin) console.log('User is an admin');
            this.#isAdmin.set(isAdmin);
        }
    }

    #handleErrors(response: Response): void {
        if (!response.ok) {
            const msg = `Response not OK fetching authentication status: ${response.statusText}`;
            throw Error(msg);
        } else if (response.status !== 200) {
            const msg = `Non-200 response (${response.status}) fetching authentication status`;
            throw Error(msg);
        } else if (
            !response.headers.get('content-type') ||
            !response.headers.get('content-type')?.startsWith('application/json')
        ) {
            const ctnt = response.headers.get('content-type');
            const msg = `Expected response to be in JSON.  Instead got ${ctnt}. ${response.statusText}`;
            throw Error(msg);
        }
    }
}

const store = new SessionStore();
store.fetchUserStatus();
export const isAdmin = store.isAdmin();
