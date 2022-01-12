/**
 * Svelte stores of photo albums
 */

import { writable, type Writable, derived, type Readable, get } from 'svelte/store';
import { get as getFromIdb, set as setToIdb } from 'idb-keyval';
import produce from "immer";
import Config from '$lib/utils/config';
import type { Album } from '$lib/models/album';
import { AlbumLoadStatus, AlbumUpdateStatus } from '$lib/models/album';
import createAlbumFromObject from '$lib/models/impl/album-creator';

export type AlbumEntry = {
	loadStatus: AlbumLoadStatus;
	album?: Album;
};

/**
 * Manages the Svelte stores of photo albums
 */
class AlbumStore {

	/**
	 * A set of Svelte stores holding the albums
	 */
	private albums: Map<string, Writable<AlbumEntry>> = new Map<string, Writable<AlbumEntry>>();

	/**
	 * A set of Svelte stores holding the album update state
	 * 
	 * Update status is different than load status: updates are AFTER the album has loaded initially.
	 */
	private albumUpdateStatuses: Map<string, Writable<AlbumUpdateStatus>> = new Map<string, Writable<AlbumUpdateStatus>>();

	/**
	 * Get an album.
	 * 
	 * This will:
	 * 
	 * 1) Immediately return a Svelte store containing an AlbumEntry.
	 * It will only have an album in it if was already requested
	 * since the last page refresh.
	 * 
	 * 2) It'll then asynchronously look for a version cached on the 
	 * browser's local disk.
	 * 
	 * 3) And then it will async fetch a live version over the network.
	 * 
	 * @param path path of the album
	 * @returns a Svelte store containing an AlbumEntry
	 */
	get(path: string, refetch = true): Readable<AlbumEntry> {
		// Get or create the writable version of the album
		const albumEntry = this.getOrCreateWritableStore(path);

		const status = get(albumEntry).loadStatus;

		// I don't have a copy in memory.  Go get it
		if (AlbumLoadStatus.NOT_LOADED === status) {
			this.setLoadStatus(path, AlbumLoadStatus.LOADING);
			this.fetchFromDiskThenServer(path);
		}
		// I have a copy in memory, but the caller has asked to re-fetch
		else if (refetch && AlbumLoadStatus.LOADING !== status) {
			this.setUpdateStatus(path, AlbumUpdateStatus.UPDATING);
			this.fetchFromServer(path);
		}

		// Derive a read-only Svelte store over the album
		return derived(
			albumEntry,
			$store => $store
		);
	}

	/**
	 * Fetch album from browser's local disk, 
	 * then fetch from server
	 * 
	 * @param path path of the album
	 */
	private fetchFromDiskThenServer(path: string): void {
		const pathInIdb = this.pathInIdb(path);
		getFromIdb(pathInIdb)
			.then((jsonAlbum) => {
				if (jsonAlbum) {
					console.log(`Album [${path}] found in idb`);

					// Put album in Svelte store
					this.setAlbum(path, jsonAlbum);
				}
				else {
					console.log(`Album [${path}] not found in idb`);
				}
			})
			.catch((error) => {
				console.log(`Album [${path}] error fetching from disk`, error);
			})
			// Always fetch from server regardless of whether it was found on
			// disk or not
			.finally(() => {
				this.fetchFromServer(path);
			});
	}

	/**
	 * Fetch album from server
	 * 
	 * @param path path of the album 
	 */
	private fetchFromServer(path: string): void {
		fetch(Config.albumUrl(path))
			.then(response => response.json())
			.then(json => {
				if (json.error) {
					if (json.status == 404) {
						this.setLoadStatus(path, AlbumLoadStatus.DOES_NOT_EXIST);
					}
					else {
						this.handleFetchError(path, json.error);
					}
				}
				else {
					console.log(`Album [${path}] fetched from server`);
					const jsonAlbum = json.album;

					// Put album in Svelte store
					this.setAlbum(path, jsonAlbum);

					// Put album in browser's local disk cache
					this.writeToDisk(path, jsonAlbum);
				}
			})
			.catch((error) => {
				this.handleFetchError(path, error);
			});
	}

	private handleFetchError(path: string, error: string): void {
		console.log(`Album [${path}] error fetching from server: `, error);

		switch (this.getLoadStatus(path)) {
			case
				AlbumLoadStatus.LOADING,
				AlbumLoadStatus.NOT_LOADED,
				AlbumLoadStatus.DOES_NOT_EXIST:
				this.setLoadStatus(path, AlbumLoadStatus.ERROR_LOADING);
				break;
			case
				AlbumLoadStatus.LOADED:
				this.setUpdateStatus(path, AlbumUpdateStatus.ERROR_UPDATING);
				break;
			case
				AlbumLoadStatus.ERROR_LOADING:
				// already in correct state
		}
	}

	/**
	 * Store the album in Svelte store
	 * 
	 * @param path path of the album 
	 * @param jsonAlbum JSON of the album
	 */
	private setAlbum(path: string, jsonAlbum: JSON): void {
		const album = createAlbumFromObject(jsonAlbum);
		const albumEntry = this.getOrCreateWritableStore(path);
		const newState = produce(get(albumEntry), (draftState: AlbumEntry) => {
			draftState.loadStatus = AlbumLoadStatus.LOADED;
			draftState.album = album;
		})
		albumEntry.set(newState);

		this.setUpdateStatus(path, AlbumUpdateStatus.NOT_UPDATING);
	}

	/**
	 * Store the album in the browser's local disk storage
	 * 
	 * @param path path of the album 
	 * @param jsonAlbum JSON of the album
	 */
	private writeToDisk(path: string, jsonAlbum: JSON): void {
		const pathInIdb = this.pathInIdb(path);
		// TODO: maybe don't write it if the value is unchanged?
		// Or maybe refresh some sort of last_fetched timestamp?
		setToIdb(pathInIdb, jsonAlbum)
			.then(() => console.log(`Album [${path}] stored in idb`))
			.catch((e) => console.log(`Album [${path}] error storing in idb`, e));
	}

	private pathInIdb(path: string): string {
		return `/${path}`;
	}

	/**
	 * Set the load status of the album
	 * 
	 * @param path path of the album 
	 * @param loadStatus 
	 */
	private setLoadStatus(path: string, loadStatus: AlbumLoadStatus): void {
		const albumEntry = this.getOrCreateWritableStore(path);
		const newState = produce(get(albumEntry), (draftState: AlbumEntry) => {
			draftState.loadStatus = loadStatus;
		})
		albumEntry.set(newState);
	}

	private getLoadStatus(path: string): AlbumLoadStatus {
		return get(this.albums.get(path)).loadStatus;
	}

	private setUpdateStatus(path: string, status: AlbumUpdateStatus): void {
		//console.log(`Album [${path}] set update status:`, status);
		const updateStatusStore = this.getOrCreateUpdateStatusStore(path);
		updateStatusStore.set(status);
	}

	private getUpdateStatus(path: string): AlbumUpdateStatus {
		return get(this.getOrCreateUpdateStatusStore(path));
	}

	/**
	 * Get the private read-write Svelte store containing the album's update status,
	 * creating it if it doesn't exist
	 * 
	 * @param path path of the album 
	 */
	private getOrCreateUpdateStatusStore(path: string): Writable<AlbumUpdateStatus> {
		let entryStore: Writable<AlbumUpdateStatus>;
		entryStore = this.albumUpdateStatuses.get(path);
		if (!entryStore) {
			const newEntry: AlbumUpdateStatus = AlbumUpdateStatus.NOT_UPDATING;
			entryStore = writable(newEntry);
		}
		this.albumUpdateStatuses.set(path, entryStore);
		return entryStore
	}

	/**
	 * Get the private read-write version of the album,
	 * creating a stand-in if it doesn't exist.
	 * 
	 * @param path path of the album 
	 */
	private getOrCreateWritableStore(path: string): Writable<AlbumEntry> {
		let albumEntry = this.albums.get(path);

		// If the album wasn't found in memory
		if (!albumEntry) {
			console.log(`Album [${path}] not found in memory`);
			// Create blank entry so that consumers have some object 
			// to which they can subscribe to changes
			albumEntry = writable({
				loadStatus: AlbumLoadStatus.NOT_LOADED
			});
			this.albums.set(path, albumEntry);
		}

		return albumEntry;
	}
}

export const albumStore:AlbumStore = new AlbumStore();