/**
 * A Svelte store representing the current user / session
 */

import Config from '$lib/utils/config';
import { writable, type Writable, derived, type Readable } from 'svelte/store';
import { dev } from '$app/environment';

/**
 * Manages the Svelte stores about a user session
 */
class SessionStore {
    /**
     * A private writable Svelte store holding whether the user is an admin
     */
    private _isAdmin: Writable<boolean> = writable(false);

    /**
     * @returns a read-only Svelte store that says whether the current user is an admin
     */
    isAdmin(): Readable<boolean> {
        // create a derived store
        return derived(this._isAdmin, ($isAdmin) => {
            return $isAdmin;
        });
    }

    /**
     * Fetch current user's status from server
     */
    async fetchUserStatus(): Promise<void> {
        const fakeAdmin: boolean = dev;
        if (fakeAdmin) {
            console.warn('FAKE: setting user to be an admin');
            this._isAdmin.set(true);
        } else {
            const uri = Config.checkAuthenticationUrl();
            const response = await fetch(uri, {
                // no-store: the browser fetches from the remote server without first looking in the cache,
                // and will not update the cache with the downloaded resource
                cache: 'no-store',
                credentials: 'include',
            });
            this.handleErrors(response);
            const json = await response.json();
            const isAdmin = !!json.isAdmin;
            if (isAdmin) console.log('User is an admin');
            this._isAdmin.set(isAdmin);
        }
    }

    private handleErrors(response: Response): void {
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
