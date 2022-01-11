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
	get(path: string): Readable<AlbumEntry> {
		// Get or create the writable version of the album
		const albumEntry = this.getOrCreateWritableStore(path);

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
	private fetchFromDisk(path: string): void {
		const pathInIdb = `a:${path}`;
		getFromIdb(pathInIdb)
			.then((data) => {
				if (data) {
					console.log(`Found album [${path}] in idb: `, data);
					const album = createAlbumFromObject(data);
					const albumEntry = this.getOrCreateWritableStore(path);
					const newState = produce(get(albumEntry), (draftState: AlbumEntry) => {
						draftState.loadStatus = AlbumLoadStatus.LOADED;
						draftState.album = album;
					})
					albumEntry.set(newState);
				}
				else {
					console.log(`Did not find album [${path}] in idb`);
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
				console.log(`fetched album [${path}] from server:`, json.album);
				const jsonAlbum = json.album;
				// Put album in Svelte store and browser's local disk cache
				this.setAlbum(path, jsonAlbum);
			})
			.catch((error) => {
				this.setLoadStatus(path, AlbumLoadStatus.ERROR_LOADING);
				console.log(`Error fetching album [${path}] from server: `, error);
			});
	}

	/**
	 * Store the album in Svelte store and the browser's local disk storage
	 * 
	 * @param path path of the album 
	 * @param jsonAlbum JSON of the album
	 */
	private setAlbum(path: string, jsonAlbum: JSON): void {

		// Update Svelte store
		const album = createAlbumFromObject(jsonAlbum);
		const albumEntry = this.getOrCreateWritableStore(path);
		const newState = produce(get(albumEntry), (draftState: AlbumEntry) => {
			draftState.loadStatus = AlbumLoadStatus.LOADED;
			draftState.album = album;
		})
		albumEntry.set(newState);

		// Add to disk storage
		// TODO: this is where Redux is great, this should fire an ALBUM_UPDATED
		// and something else should take care of updating disk storage
		this.writeToDisk(path, jsonAlbum);
	}

	/**
	 * Store the album in the browser's local disk storage
	 * 
	 * @param path path of the album 
	 * @param jsonAlbum JSON of the album
	 */
	private writeToDisk(path: string, jsonAlbum: JSON): void {
		const pathInIdb = `a:${path}`;
		setToIdb(pathInIdb, jsonAlbum)
			.then(() => console.log(`Stored ${path} in idb`))
			.catch((e) => console.log(`Error saving album [${path}] to idb`, e));
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
	 * Get the private read-write version of the album
	 * 
	 * If I don't have the album in memory, kick off an 
	 * async fetch of it from the browser's local disk.
	 * 
	 * @param path path of the album 
	 */
	private getOrCreateWritableStore(path: string): Writable<AlbumEntry> {
		let albumEntry = this.albums.get(path);

		// If the album wasn't found in memory
		if (!albumEntry) {
			console.log(`Did not find album [${path}] in memory`);
			// Create blank entry so that consumers have some object 
			// to which they can subscribe to changes
			albumEntry = writable({
				loadStatus: AlbumLoadStatus.NOT_LOADED
			});
			this.albums.set(path, albumEntry);

			// Kick off a fetch from disk
			this.fetchFromDisk(path);
		}

		return albumEntry;
	}

}

export const albumStore:AlbumStore = new AlbumStore();