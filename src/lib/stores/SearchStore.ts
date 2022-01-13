/**
 * Svelte stores of search results
 */

import { writable, type Writable, derived, type Readable, get } from 'svelte/store';
import { get as getFromIdb, set as setToIdb } from 'idb-keyval';
import produce from "immer";
import Config from '$lib/utils/config';
import type { Search, SearchResults } from '$lib/models/search';
import { SearchLoadStatus, SearchUpdateStatus } from '$lib/models/search';

/**
 * Manages the Svelte stores of search results
 */
class SearchStore {

	/**
	 * A set of Svelte stores holding search results
	 */
	 private searches: Map<string, Writable<Search>> = new Map<string, Writable<Search>>();

	 /**
		* A set of Svelte stores holding the search update state
		* 
		* Update status is different than load status: updates are AFTER the 
		* initial search has loaded.  You are refreshing the existing results.
		*/
	private SearchUpdateStatuses: Map<string, Writable<SearchUpdateStatus>> = new Map<string, Writable<SearchUpdateStatus>>();
	
	/**
	 * Get search results.
	 * 
	 * This will:
	 * 
	 * 1) Immediately return a Svelte store.
	 * It will only have search results in it if was already requested
	 * since the last page refresh.
	 * 
	 * 2) It'll then asynchronously look for a version cached on the 
	 * browser's local disk.
	 * 
	 * 3) And then it will async fetch a live version over the network.
	 * 
	 * @param searchTerms the search terms
	 * @returns a Svelte store 
	 */
		get(searchTerms: string, refetch = true): Readable<Search> {
			// Get or create the writable version of the search
			const searchEntry = this.getOrCreateWritableStore(searchTerms);
	
			const status = get(searchEntry).status;
	
			// I don't have a copy in memory.  Go get it
			if (SearchLoadStatus.NOT_LOADED === status) {
				this.setLoadStatus(searchTerms, SearchLoadStatus.LOADING);
				this.fetchFromDiskThenServer(searchTerms);
			}
			// I have a copy in memory, but the caller has asked to re-fetch
			else if (refetch && SearchLoadStatus.LOADING !== status) {
				this.setUpdateStatus(searchTerms, SearchUpdateStatus.UPDATING);
				this.fetchFromServer(searchTerms);
			}
	
			// Derive a read-only Svelte store over the search
			return derived(
				searchEntry,
				$store => $store
			);
		}
	
		/**
		 * Fetch search from browser's local disk, 
		 * then fetch from server
		 * 
		 * @param searchTerms the search terms
		 */
		private fetchFromDiskThenServer(searchTerms: string): void {
			const pathInIdb = this.idbKey(searchTerms);
			getFromIdb(pathInIdb)
				.then((jsonSearch) => {
					if (jsonSearch) {
						console.log(`Search [${searchTerms}] found in idb`);
	
						// Put search in Svelte store
						this.setSearch(searchTerms, jsonSearch);
					}
					else {
						console.log(`Search [${searchTerms}] not found in idb`);
					}
				})
				.catch((error) => {
					console.log(`Search [${searchTerms}] error fetching from disk`, error);
				})
				// Always fetch from server regardless of whether it was found on
				// disk or not
				.finally(() => {
					this.fetchFromServer(searchTerms);
				});
		}
	
		/**
		 * Fetch search results from server
		 * 
		 * @param searchTerms the search terms 
		 */
		private fetchFromServer(searchTerms: string): void {
			fetch(Config.searchUrl(searchTerms))
				.then(response => response.json())
				.then(json => {
					if (json.error) {
						this.handleFetchError(searchTerms, json.error);
					}
					else {
						console.log(`Search [${searchTerms}] fetched from server`);

						// TODO: better error handling if we don't get back expected response,
						// rather than just accepting the JSON
						const searchResults: SearchResults = json.search;
	
						// Put search results in Svelte store
						this.setSearch(searchTerms, searchResults);
	
						// Put search results in browser's local disk cache
						this.writeToDisk(searchTerms, searchResults);
					}
				})
				.catch((error) => {
					this.handleFetchError(searchTerms, error);
				});
		}
	
		private handleFetchError(searchTerms: string, error: string): void {
			console.log(`Search [${searchTerms}] error fetching from server: `, error);
	
			const status = this.getLoadStatus(searchTerms);
			switch (status) {
				case SearchLoadStatus.LOADING:
				case SearchLoadStatus.NOT_LOADED:
					this.setLoadStatus(searchTerms, SearchLoadStatus.ERROR_LOADING);
					break;
				case SearchLoadStatus.LOADED:
					this.setUpdateStatus(searchTerms, SearchUpdateStatus.ERROR_UPDATING);
					break;
				case SearchLoadStatus.ERROR_LOADING:
					// already in correct state
					break;
				default:
					console.log("Unexepected load status:", status);
			}
		}
	
		/**
		 * Store the search results in Svelte store
		 * 
		 * @param searchTerms the search terms 
		 * @param searchResults the search results
		 */
		private setSearch(searchTerms: string, searchResults: SearchResults): void {
			const searchEntry = this.getOrCreateWritableStore(searchTerms);
			const newState = produce(get(searchEntry), (draftState: Search) => {
				draftState.status = SearchLoadStatus.LOADED;
				draftState.results = searchResults;
			})
			searchEntry.set(newState);
	
			this.setUpdateStatus(searchTerms, SearchUpdateStatus.NOT_UPDATING);
		}
	
		/**
		 * Store the search results in the browser's local disk storage
		 * 
		 * @param searchTerms the search terms 
		 * @param searchResults the search results
		 */
		private writeToDisk(searchTerms: string, searchResults: SearchResults): void {
			const key = this.idbKey(searchTerms);
			// TODO: maybe don't write it if the value is unchanged?
			// Or maybe refresh some sort of last_fetched timestamp?
			setToIdb(key, searchResults)
				.then(() => console.log(`Search [${searchTerms}] stored in idb`))
				.catch((e) => console.log(`Search [${searchTerms}] error storing in idb`, e));
		}
	
	/**
	 * Get the IndexedDB key under which to store the search results
	 * 
	 * @param searchTerms the search terms
	 * @returns the key under which to store the search results in IndexedDB
	 */
		private idbKey(searchTerms: string): string {
			return `s:${searchTerms}`;
		}
	
		/**
		 * Set the load status of the search
		 * 
		 * @param searchTerms the search terms 
		 * @param loadStatus 
		 */
		private setLoadStatus(searchTerms: string, loadStatus: SearchLoadStatus): void {
			const searchEntry = this.getOrCreateWritableStore(searchTerms);
			const newState = produce(get(searchEntry), (draftState: Search) => {
				draftState.status = loadStatus;
			})
			searchEntry.set(newState);
		}
	
		private getLoadStatus(searchTerms: string): SearchLoadStatus {
			return get(this.searches.get(searchTerms)).status;
		}
	
		private setUpdateStatus(searchTerms: string, status: SearchUpdateStatus): void {
			console.log(`Search [${searchTerms}] set update status:`, status);
			const updateStatusStore = this.getOrCreateUpdateStatusStore(searchTerms);
			updateStatusStore.set(status);
		}
	
		private getUpdateStatus(searchTerms: string): SearchUpdateStatus {
			return get(this.getOrCreateUpdateStatusStore(searchTerms));
		}
	
		/**
		 * Get the private read-write Svelte store containing the search's update status,
		 * creating it if it doesn't exist
		 * 
		 * @param searchTerms the search terms 
		 */
		private getOrCreateUpdateStatusStore(searchTerms: string): Writable<SearchUpdateStatus> {
			let entryStore: Writable<SearchUpdateStatus>;
			entryStore = this.SearchUpdateStatuses.get(searchTerms);
			if (!entryStore) {
				const newEntry: SearchUpdateStatus = SearchUpdateStatus.NOT_UPDATING;
				entryStore = writable(newEntry);
			}
			this.SearchUpdateStatuses.set(searchTerms, entryStore);
			return entryStore
		}
	
		/**
		 * Get the private read-write version of the search,
		 * creating a stand-in if it doesn't exist.
		 * 
		 * @param searchTerms the search terms 
		 */
		private getOrCreateWritableStore(searchTerms: string): Writable<Search> {
			let searchEntry = this.searches.get(searchTerms);
	
			// If the search wasn't found in memory
			if (!searchEntry) {
				console.log(`Search [${searchTerms}] not found in memory`);
				// Create blank entry so that consumers have some object 
				// to which they can subscribe to changes
				searchEntry = writable({
					status: SearchLoadStatus.NOT_LOADED
				});
				this.searches.set(searchTerms, searchEntry);
			}
	
			return searchEntry;
		}
}

export const searchStore:SearchStore = new SearchStore();