/**
 * Svelte stores of photo albums
 */

import { writable, type Writable, derived, type Readable, get } from 'svelte/store';
import { get as getFromIdb, set as setToIdb } from 'idb-keyval';
import {produce} from "immer";
import Config from '$lib/utils/config';
import { type Album, AlbumType } from '$lib/models/album';
import { AlbumLoadStatus, AlbumUpdateStatus } from '$lib/models/album';
import createAlbumFromObject from '$lib/models/impl/album-creator';
import { getAlbumType } from '$lib/utils/path-utils';

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
	private albumUpdateStatuses: Map<string, Writable<AlbumUpdateStatus>> = new Map<
		string,
		Writable<AlbumUpdateStatus>
	>();

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
		return derived(albumEntry, ($store) => $store);
	}

	/**
	 * Get an album from in memory only; do not fetch from local storage or network
	 *
	 * @param path path of the album
	 * @returns null if album not found
	 */
	getFromInMemory(path: string): AlbumEntry | null {
		const albumEntry = this.albums.get(path);
		return albumEntry ? get(albumEntry) : null;
	}

	/**
	 * Update the album in the Svelte store and on the browser's local disk cache
	 */
	updateAlbumEntry(albumEntry: AlbumEntry): void {
		if (!albumEntry) throw 'Album entry is null';
		if (!albumEntry.album) throw 'Album is null';
		const albumEntryStore = this.albums.get(albumEntry.album.path);
		if (!albumEntryStore) throw 'albumEntryStore is null';
		albumEntryStore.set(albumEntry);
		this.writeToDisk(albumEntry.album.path, albumEntry.album);
	}

	/**
	 * Set which thumbnail is selected as the thumbnail
	 * for the album.
	 *
	 * TODO: editing actions shouldn't be in the same file
	 * as the load actions, so that non-admin users aren't
	 * downloading more code than they need to.
	 *
	 * @param state
	 * @param payload
	 */
	setThumbnail(albumPath: string, thumbnailUrl: string) {
		console.log(`Album [${albumPath}] set thumbnail:`, thumbnailUrl);

		const albumEntry = this.albums.get(albumPath);
		if (!albumEntry)
			throw new Error(`Did not find album [${albumPath}] on which to set selected thumbnail`);

		albumEntry.update((draftAlbumEntry) => {
			draftAlbumEntry.album.url_thumb = thumbnailUrl;
			return draftAlbumEntry;
		});
	}

	/**
	 * Fetch album from browser's local disk,
	 * then fetch from server
	 *
	 * @param path path of the album
	 */
	private fetchFromDiskThenServer(path: string): void {
		const idbKey = this.idbKey(path);
		getFromIdb(idbKey)
			.then((albumObject) => {
				if (albumObject) {
					console.log(`Album [${path}] found in idb`);

					// Put album in Svelte store
					this.setAlbum(path, albumObject);
				} else {
					console.log(`Album [${path}] not found in idb`);
				}
			})
			.catch((error) => {
				console.error(`Album [${path}] error fetching from disk`, error);
			})
			// Fetch from server regardless of whether it was found on disk
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
		const url = Config.albumUrl(path);
		const requestConfig = this.buildFetchConfig(path);
		fetch(url, requestConfig)
			.then((response) => response.json())
			.then((json) => {
				if (json.error) {
					if (json.status == 404) {
						this.setLoadStatus(path, AlbumLoadStatus.DOES_NOT_EXIST);
					} else {
						this.handleFetchError(path, json.error);
					}
				} else {
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

	/**
	 * Build the configuration for the HTTP fetch
	 */
	private buildFetchConfig(albumPath: string): RequestInit {
		const requestConfig: RequestInit = {};

		// no-store: bypass the HTTP cache completely.
		// This will make the browser not look into the HTTP cache
		// on the way to the network, and never store the resulting
		// response in the HTTP cache.
		// Fetch() will behave as if no HTTP cache exists.
		requestConfig.cache = 'no-store';

		// Only send credentials if we're in prod.
		// This helps with testing in development.
		// The production build process replaces the text 'process.env.NODE_ENV'
		// with the literal string 'production'
		if ('production' === process.env.NODE_ENV) {
			// Only send credentials for day albums.
			// Because the root and year albums are served
			// from *.json files on disk, and the apache
			// .htaccess file in that directory is configured
			// to serve Access-Control-Allow-Origin "*"
			// And Chrome doesn't allow you to send credentials
			// to a wildcard domain.  Blech.
			const albumType = getAlbumType(albumPath);
			if (albumType == AlbumType.DAY) {
				requestConfig.credentials = 'include';
			}
		}

		return requestConfig;
	}

	private handleFetchError(path: string, error: string): void {
		console.error(`Album [${path}] error fetching from server: `, error);

		const status = this.getLoadStatus(path);
		switch (status) {
			case AlbumLoadStatus.LOADING:
			case AlbumLoadStatus.NOT_LOADED:
			case AlbumLoadStatus.DOES_NOT_EXIST:
				this.setLoadStatus(path, AlbumLoadStatus.ERROR_LOADING);
				break;
			case AlbumLoadStatus.LOADED:
				this.setUpdateStatus(path, AlbumUpdateStatus.ERROR_UPDATING);
				break;
			case AlbumLoadStatus.ERROR_LOADING:
				// already in correct state
				break;
			default:
				console.error('Unexepected load status:', status);
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
		});
		albumEntry.set(newState);

		this.setUpdateStatus(path, AlbumUpdateStatus.NOT_UPDATING);
	}

	/**
	 * Store the album in the browser's local disk storage
	 *
	 * @param path path of the album
	 */
	private writeToDisk(path: string, album: JSON | Album): void {
		const idbKey = this.idbKey(path);
		// TODO: maybe don't write it if the value is unchanged?
		// Or maybe refresh some sort of last_fetched timestamp?
		setToIdb(idbKey, album)
			.then(() => console.log(`Album [${path}] stored in idb`))
			.catch((e) => console.error(`Album [${path}] error storing in idb`, e));
	}

	/**
	 * @returns key of the album in IndexedDB
	 */
	private idbKey(path: string): string {
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
		});
		albumEntry.set(newState);
	}

	private getLoadStatus(path: string): AlbumLoadStatus {
		return get(this.albums.get(path)).loadStatus;
	}

	setUpdateStatus(path: string, status: AlbumUpdateStatus): void {
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
		let entryStore = this.albumUpdateStatuses.get(path);
		if (!entryStore) {
			const newEntry: AlbumUpdateStatus = AlbumUpdateStatus.NOT_UPDATING;
			entryStore = writable(newEntry);
		}
		this.albumUpdateStatuses.set(path, entryStore);
		return entryStore;
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

export const albumStore: AlbumStore = new AlbumStore();
