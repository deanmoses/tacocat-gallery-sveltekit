import { dev } from '$app/environment';
import { checkAuthenticationUrl } from '$lib/utils/config';

/** True: simulate being an admin when in a dev (localhost) environment */
const FAKE_ADMIN_ON_DEV = true;

/**
 * Store of the current user / session
 */
class SessionStore {
    /**
     * A private writable store holding whether the user is an admin
     */
    #isAdmin: boolean = $state(false);

    /**
     * Public read-only store that says whether the current user is an admin
     */
    isAdmin: boolean = $derived(this.#isAdmin);

    /**
     * Fetch current user's status from server
     */
    async fetchUserStatus(): Promise<void> {
        const fakeAdmin: boolean = FAKE_ADMIN_ON_DEV && dev;
        if (fakeAdmin) {
            console.warn('FAKE: setting user to be an admin');
            this.#isAdmin = true;
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
            this.#isAdmin = isAdmin;
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

export const sessionStore = new SessionStore();
sessionStore.fetchUserStatus();
