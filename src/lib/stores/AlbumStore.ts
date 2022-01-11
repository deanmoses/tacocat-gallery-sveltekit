/**
 * A Svelte store representing the draft changes to an album or a image
 */

import { writable, type Writable, derived, type Readable, get } from 'svelte/store';
import { get as getFromIdb, set as setToIdb } from 'idb-keyval';
import produce from "immer";
import Config from '$lib/utils/config';
import type { Album } from '$lib/models/album';
import { AlbumLoadStatus } from '$lib/models/album';
import createAlbumFromObject from '$lib/models/impl/album-creator';

export type AlbumEntry = {
	loadStatus: AlbumLoadStatus;
//	updateStatus: AlbumUpdateStatus;
	album?: Album;
};

/**
 * Manages the Svelte store of photo albums
 */
class AlbumStore {

	/**
	 * An internal-only set of Svelte stores holding the albums
	 */
	private albums: Map<string, Writable<AlbumEntry>> = new Map<string, Writable<AlbumEntry>>();

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

		// Maybe fetch the album
		if (this.shouldFetch(refetch, get(albumEntry).loadStatus)) {
			this.fetchFromDiskThenServer(path);
		}

		// Derive a read-only Svelte store over the album
		return derived(
			albumEntry,
			$store => $store
		);
	}

	/**
	 * Return true if I should fetch the album
	 * @param refetch 
	 * @param status 
	 */
	private shouldFetch(refetch: boolean, status: AlbumLoadStatus): boolean {
		return (AlbumLoadStatus.NOT_LOADED === status) // ... it isn't loaded
			|| (refetch && AlbumLoadStatus.LOADING !== status); // ... if the caller asked for it, and it's not already loading
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
					console.log(`Album [${path}] found in idb: `, jsonAlbum);

					// Put album in Svelte store
					this.setAlbum(path, jsonAlbum);
				}
				else {
					console.log(`Album [${path}] not found in idb`);
				}
			})
			.catch((error) => {
				console.log(`Error fetching album [${path}] from disk`, error);
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
		this.setLoadStatus(path, AlbumLoadStatus.LOADING);

		fetch(Config.albumUrl(path))
			.then(response => response.json())
			.then(json => {
				if (json.error) {
					if (json.status == 404) {
						this.setLoadStatus(path, AlbumLoadStatus.DOES_NOT_EXIST);
					}
					else {
						console.log(`Error fetching album [${path}] from server: `, json.message);
						this.setLoadStatus(path, AlbumLoadStatus.ERROR_LOADING);
					}
				}
				else {
					console.log(`Album [${path}] fetched from server:`, json.album);
					const jsonAlbum = json.album;

					// Put album in Svelte store
					this.setAlbum(path, jsonAlbum);

					// Put album in browser's local disk cache
					this.writeToDisk(path, jsonAlbum);
				}
			})
			.catch((error) => {
				console.log(`Error fetching album [${path}] from server: `, error);
				this.setLoadStatus(path, AlbumLoadStatus.ERROR_LOADING);
			});
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
	}

	/**
	 * Store the album in the browser's local disk storage
	 * 
	 * @param path path of the album 
	 * @param jsonAlbum JSON of the album
	 */
	private writeToDisk(path: string, jsonAlbum: JSON): void {
		const pathInIdb = this.pathInIdb(path);
		setToIdb(pathInIdb, jsonAlbum)
			.then(() => console.log(`Album [${path}] stored in idb`))
			.catch((e) => console.log(`Error saving album [${path}] to idb`, e));
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