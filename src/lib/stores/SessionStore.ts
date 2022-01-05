/**
 * A Svelte store representing the current user / session
 */

import Config from '$lib/utils/config';
import { writable, type Writable, derived, type Readable } from 'svelte/store';

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
    async fetchUserStatus() : Promise<void> {
        const uri = Config.checkAuthenticationUrl();
        const response = await fetch(uri, {credentials: 'include'});
        const json = await response.json();
        console.log(`fetchUserStatus() fetched`, json);
        const isAdmin = !!json.isAdmin;
        console.log(isAdmin ? 'user is an admin' : 'user is not an admin');
        this._isAdmin.set(isAdmin);
    }
}

const store = new SessionStore();
store.fetchUserStatus(); // this is async, I don't think it blocks, right?
export const isAdmin = store.isAdmin();