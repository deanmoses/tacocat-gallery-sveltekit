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
	 * Get an album from the store (but do not attempt to fetch it)
	 * @param path path of the album
	 */
	get(path: string): Readable<AlbumEntry> {
		console.log(`AlbumStore.get(${path})`);

		// Get or create the writable version of the album
		const albumEntry = this.getOrCreateWritableStore(path);

		// Derive a read-only Svelte store over the album
		return derived(
			albumEntry,
			$store => $store
		);
	}

	/**
	 * Fetch album from disk
	 * @param path 
	 */
	fetchFromDisk(path: string): void {
		const pathInIdb = `a:${path}`;
		getFromIdb(pathInIdb)
			.then((data) => {
				if (data) {
					console.log(`Fetched [${path}] from idb: `, data);
					const album = createAlbumFromObject(data);
					console.log("album: ", album);
					const albumEntry = this.getOrCreateWritableStore(path);
					const newState = produce(get(albumEntry), (draftState: AlbumEntry) => {
						draftState.loadStatus = AlbumLoadStatus.LOADED;
						draftState.album = album;
					})
					albumEntry.set(newState);
				}
				else {
					console.log(`Did not find ${path} in idb`);
					this.fetchFromServer(path);
				}
			})
			.catch((error) => {
				console.log(`Error fetching album [${path}] from disk: `, error);
			});
	}

	/**
	 * Fetch album from server
	 * @param path 
	 */
	fetchFromServer(path: string): void {
		this.setLoadStatus(path, AlbumLoadStatus.LOADING);

		fetch(Config.albumUrl(path))
			.then(response => response.json())
			.then(json => {
				console.log(`fetched album [${path}] from server:`, json.album);
				const jsonAlbum = json.album;

				// Update store
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
				console.log(`Storing [${path} in idb]`);
				const pathInIdb = `a:${path}`;
				setToIdb(pathInIdb, jsonAlbum);
				console.log(`Stored ${path} in idb`);
			})
			.catch((error) => {
				this.setLoadStatus(path, AlbumLoadStatus.ERROR_LOADING);
				console.log(`Error fetching album [${path}] from server: `, error);
			});
	}

	/**
	 * 
	 * @param path 
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
	 * @param path 
	 */
	private getOrCreateWritableStore(path: string): Writable<AlbumEntry> {
		let albumEntry = this.albums.get(path);

		// If I don't know about the album
		if (!albumEntry) {

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