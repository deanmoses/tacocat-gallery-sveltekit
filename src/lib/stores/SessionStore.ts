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
	async fetchUserStatus(): Promise<void> {
		const uri = Config.checkAuthenticationUrl();
		const response = await fetch(uri, { credentials: 'include' });
		this.handleErrors(response);
		const json = await response.json();
		const isAdmin = !!json.isAdmin;
		if (isAdmin) console.log("User is an admin");
		this._isAdmin.set(isAdmin);
	}

	private handleErrors(response: Response): void {
		if (!response.ok) {
			console.log(
				'Response not OK fetching authentication status: ',
				response.statusText
			);
			throw Error(response.statusText);
		}
		else if (response.status === 404) {
			console.log('404 fetching authentication status: ', response.statusText);
			throw Error(response.statusText);
		}
		else if (response.status !== 200) {
			console.log(
				'Non-200 response fetching authentication status: ',
				response.statusText
			);
			throw Error(response.statusText);
		}
	}
}

const store = new SessionStore();
store.fetchUserStatus(); // this is async, I don't think it blocks, right?
export const isAdmin = store.isAdmin();