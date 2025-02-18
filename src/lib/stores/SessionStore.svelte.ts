import { dev } from '$app/environment';
import { checkAuthenticationUrl } from '$lib/utils/config';
import { get as getFromIdb, set as setToIdb } from 'idb-keyval';

/** True: simulate being an admin when in a dev (localhost) environment */
const FAKE_ADMIN_ON_DEV = true;
const HasBeenLoggedInIDBKey = 'HasBeenLoggedIn';
/**
 * Store of the current user / session
 */
class SessionStore {
    #isAdmin: boolean = $state(false);
    isAdmin: boolean = $derived(this.#isAdmin);
    #hasBeenLoggedIn: boolean = $state(false);
    hasBeenLoggedIn: boolean = $derived(this.#hasBeenLoggedIn);

    //
    // STATE TRANSITION METHODS
    // These mutate the store's state.
    //
    // Characteristics:
    //  - These are the ONLY way to update this store's state.
    //    These should be the only public methods on this store.
    //  - These ONLY update state.
    //    If they have to do any work, like making a server call, they invoke it in an
    //    event-like fire-and-forget fashion, meaning invoke async methods *without* await.
    //  - These are synchronous.
    //    They expectation is that they return near-instantly.
    //  - These return void.
    //    To read this store's state, use one of the public $derived() fields
    //

    fetchUserStatus(): void {
        this.#fetchUserStatus(); // invoke async service in fire-and-forget fashion
    }

    fetchHasBeenLoggedIn(): void {
        this.#fetchHasBeenLoggedIn(); // invoke async service in fire-and-forget fashion
    }

    #authenticationSuccess(): void {
        this.#isAdmin = true;
    }

    #hasBeenLoggedInSuccess(): void {
        console.log('User has been logged in before');
        this.#hasBeenLoggedIn = true;
    }

    //
    // SERVICE METHODS
    // These 'do work', like making a server call.
    //
    // Characteristics:
    //  - These are private, meant to only be called by STATE TRANSITION METHODS
    //  - These don't mutate state directly; rather, they call STATE TRANSITION METHODS to do it
    //  - These are generally async.
    //  - These don't return values; they return void or Promise<void>
    //

    /**
     * Fetch current user's status from server
     */
    async #fetchUserStatus(): Promise<void> {
        const fakeAdmin: boolean = FAKE_ADMIN_ON_DEV && dev;
        if (fakeAdmin) {
            console.warn('FAKE: setting user to be an admin');
            this.#authenticationSuccess();
        } else {
            const response = await fetch(checkAuthenticationUrl(), {
                // no-store: the browser fetches from the remote server without first looking in the cache,
                // and will not update the cache with the downloaded resource
                cache: 'no-store',
                credentials: 'include',
            });
            // 401 unauthorized
            if (401 === response.status) {
                // User is not logged in,
                // check to see whether they have
                // EVER been logged in
                if (!this.hasBeenLoggedIn) {
                    await this.#fetchHasBeenLoggedIn();
                }
                return;
            }
            this.#handleErrors(response);
            const json = await response.json();
            const isAdmin = !!json.user;
            if (isAdmin) {
                console.log('User is an admin');
                this.#authenticationSuccess();
                await setToIdb(HasBeenLoggedInIDBKey, true);
            }
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

    async #fetchHasBeenLoggedIn(): Promise<void> {
        const hasBeenLoggedIn = await getFromIdb(HasBeenLoggedInIDBKey);
        if (hasBeenLoggedIn) this.#hasBeenLoggedInSuccess();
        else {
            console.log(`user has never been logged in before: `, hasBeenLoggedIn);
        }
    }
}

export const sessionStore = new SessionStore();
sessionStore.fetchUserStatus();
