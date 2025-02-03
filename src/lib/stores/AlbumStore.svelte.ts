import { produce } from 'immer';
import { get as getFromIdb, set as setToIdb, del as delFromIdb } from 'idb-keyval';
import { AlbumLoadStatus, AlbumUpdateStatus, type AlbumEntry } from '$lib/models/album';
import toAlbum from '$lib/models/impl/AlbumCreator';
import { isValidAlbumPath } from '$lib/utils/galleryPathUtils';
import type { Album } from '$lib/models/GalleryItemInterfaces';
import type { AlbumRecord } from '$lib/models/impl/server';
import { albumUrl } from '$lib/utils/config';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Store of albums
 */
class AlbumStore {
    /**
     * Private writable store
     */
    #albums: Map<string, AlbumEntry> = new SvelteMap<string, AlbumEntry>();

    /**
     * Public read-only version of store
     */
    readonly albums: ReadonlyMap<string, AlbumEntry> = $derived(this.#albums);

    /**
     * Private writable store holding album update statuses.
     *
     * Update status is different than load status: updates are AFTER the album has loaded initially.
     */
    #albumUpdateStatuses: Map<string, AlbumUpdateStatus> = new SvelteMap<string, AlbumUpdateStatus>();

    /**
     * Public read-only version of album update statuses
     */
    readonly albumUpdateStatuses: ReadonlyMap<string, AlbumUpdateStatus> = $derived(this.#albumUpdateStatuses);

    /**
     * Fetch an album.
     *
     * This will:
     * 1) First async look for a version cached on the browser's local disk.
     * 2) Then async fetch a live version over the network.
     *
     * @param path path of the album
     * @param refetch refetch from server even if it already exists on disk
     */
    fetch(path: string, refetch = true): void {
        if (!isValidAlbumPath(path)) throw new Error(`Invalid album path [${path}]`);

        const albumEntry = this.#albums.get(path);
        const status = albumEntry?.loadStatus;

        // I don't have a copy in memory.  Go get it
        if (!status || AlbumLoadStatus.NOT_LOADED === status) {
            this.#setLoadStatus(path, AlbumLoadStatus.LOADING);
            this.#fetchFromDiskThenServer(path);
        }
        // I have a copy in memory, but the caller has asked to re-fetch
        else if (refetch && AlbumLoadStatus.LOADING !== status) {
            this.setUpdateStatus(path, AlbumUpdateStatus.UPDATING);
            this.#fetchFromServer(path);
        }
    }

    /**
     * Update the album in the Svelte store and on the browser's local disk cache
     */
    updateAlbumEntry(albumEntry: AlbumEntry): void {
        if (!albumEntry) throw 'Album entry is null';
        if (!albumEntry.album) throw 'Album is null';
        const oldAlbumEntry = this.#albums.get(albumEntry.album.path);
        if (!oldAlbumEntry) throw 'albumEntryStore is null';
        this.#albums.set(albumEntry.album.path, albumEntry);
        this.#writeToDisk(albumEntry.album.path, albumEntry.album.json); // Put album in browser's local disk cache
    }

    /**
     * Fetch album from browser's local disk,
     * then fetch from server
     *
     * @param path path of the album
     */
    #fetchFromDiskThenServer(path: string): void {
        const idbKey = this.#idbKey(path);
        getFromIdb(idbKey)
            .then((albumObject) => {
                if (albumObject) {
                    console.log(`Album [${path}] found in idb`);

                    // Put album in Svelte store
                    this.#setAlbum(path, albumObject);
                } else {
                    console.log(`Album [${path}] not found in idb`);
                }
            })
            .catch((error) => {
                console.error(`Album [${path}] error fetching from disk`, error);
            })
            // Fetch from server regardless of whether it was found on disk
            .finally(() => {
                this.#fetchFromServer(path);
            });
    }

    /**
     * Fetch album from server
     * TODO: rationalize this with the async version @see fetchFromServerAsync()
     *
     * @param path path of the album
     */
    #fetchFromServer(path: string): void {
        fetch(albumUrl(path), this.#buildFetchConfig())
            .then((response: Response) => {
                if (response.status == 404) {
                    console.warn(`Album not found on server: [${path}]`);
                    this.#setLoadStatus(path, AlbumLoadStatus.DOES_NOT_EXIST);
                    this.#albums.delete(path); // Delete album from Svelte store
                    this.#removeFromDisk(path); // Delete album from browser's local disk cache
                } else if (!response.ok) throw new Error(response.statusText);
                return response.json();
            })
            .then((json: AlbumRecord) => {
                console.log(`Album [${path}] fetched from server`, json);
                this.#setAlbum(path, json); // Put album in Svelte store
                this.#writeToDisk(path, json); // Put album in browser's local disk cache
            })
            .catch((error) => {
                this.#handleFetchError(path, error);
            });
    }

    /**
     * Return true if album exists
     */
    async albumExists(path: string): Promise<boolean> {
        if (!isValidAlbumPath(path)) throw new Error(`Invalid album path [${path}]`);

        // First check in memory
        console.log(`Checking if album [${path}] exists in memory`);
        const albumEntry = this.#albums.get(path);
        if (albumEntry?.loadStatus === AlbumLoadStatus.LOADED || albumEntry?.loadStatus === AlbumLoadStatus.LOADING) {
            return true;
        } else if (albumEntry?.loadStatus === AlbumLoadStatus.DOES_NOT_EXIST) {
            return false;
        }

        // Then check disk cache
        console.log(`Checking if album [${path}] exists on disk`);
        const albumRecord = await this.#fetchFromDisk(path);
        if (albumRecord) {
            return true;
        }

        // Then check server
        console.log(`Checking if album [${path}] exists on server`);
        const url = albumUrl(path);
        const requestConfig = this.#buildFetchConfig();
        requestConfig.method = 'HEAD';
        const response = await fetch(url, requestConfig);
        if (response.status === 404) return false;
        if (response.ok) return true;
        throw new Error(`Unexpected response [${response.status}] fetching album [${path}]`);
    }

    async #fetchFromDisk(path: string): Promise<AlbumRecord | undefined> {
        const idbKey = this.#idbKey(path);
        return await getFromIdb(idbKey);
    }

    /**
     * Async version of fetchFromServer()
     * TODO: rationalize this with the non-async version - @see #fetchFromServer
     *
     * @param path path of the album
     */
    async fetchFromServerAsync(path: string): Promise<Album> {
        const response = await fetch(albumUrl(path), this.#buildFetchConfig());
        if (response.status === 404) throw 404; // TODO delete from memory & disk
        if (!response.ok) throw new Error(response.statusText);
        const json = await response.json();
        console.log(`Album [${path}] fetched from server`, json);
        const album = this.#setAlbum(path, json); // Put album in Svelte store
        this.#writeToDisk(path, json); // Put album in browser's local disk cache
        return album;
    }

    /**
     * Build the configuration for the HTTP fetch
     */
    #buildFetchConfig(): RequestInit {
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
        // @ts-expect-error: process.env.NODE_ENV is illegal, replaced by Svelte processor
        if ('production' === process.env.NODE_ENV) {
            requestConfig.credentials = 'include';
        }

        return requestConfig;
    }

    #handleFetchError(path: string, error: string): void {
        console.error(`Album [${path}] error fetching from server: `, error);

        const status = this.#getLoadStatus(path);
        switch (status) {
            case AlbumLoadStatus.LOADING:
            case AlbumLoadStatus.NOT_LOADED:
            case AlbumLoadStatus.DOES_NOT_EXIST:
                this.#setLoadStatus(path, AlbumLoadStatus.ERROR_LOADING);
                break;
            case AlbumLoadStatus.LOADED:
                this.setUpdateStatus(path, AlbumUpdateStatus.ERROR_UPDATING);
                break;
            case AlbumLoadStatus.ERROR_LOADING:
                // already in correct state
                break;
            default:
                console.error('Unexpected load status:', status);
        }
    }

    /**
     * Store the album in Svelte store
     *
     * @param path path of the album
     * @param jsonAlbum JSON of the album
     */
    #setAlbum(path: string, jsonAlbum: AlbumRecord): Album {
        const album = toAlbum(jsonAlbum);
        const albumEntry = this.#getOrCreateWritableStore(path);
        const newAlbumEntry = produce(albumEntry, (draftState: AlbumEntry) => {
            draftState.loadStatus = AlbumLoadStatus.LOADED;
            draftState.album = album;
        });
        this.#albums.set(path, newAlbumEntry);
        this.setUpdateStatus(path, AlbumUpdateStatus.NOT_UPDATING);
        return album;
    }

    /**
     * Store the album in the browser's local disk storage
     *
     * @param path path of the album
     */
    #writeToDisk(path: string, album: AlbumRecord): void {
        const idbKey = this.#idbKey(path);
        // TODO: maybe don't write it if the value is unchanged?
        // Or maybe refresh some sort of last_fetched timestamp?
        setToIdb(idbKey, album)
            .then(() => console.log(`Album [${path}] stored in idb`))
            .catch((e) => console.error(`Album [${path}] error storing in idb`, e));
    }

    /**
     * Remove album from the browser's local disk storage
     */
    #removeFromDisk(path: string): void {
        const idbKey = this.#idbKey(path);
        delFromIdb(idbKey)
            .then(() => console.log(`Album [${path}] removed from idb`))
            .catch((e) => console.error(`Album [${path}] error removing from idb`, e));
    }

    /**
     * @returns key of the album in IndexedDB
     */
    #idbKey(path: string): string {
        return `${path}`;
    }

    /**
     * Set the load status of the album
     *
     * @param path path of the album
     * @param loadStatus
     */
    #setLoadStatus(path: string, loadStatus: AlbumLoadStatus): void {
        const albumEntry = this.#getOrCreateWritableStore(path);
        const newAlbumEntry = produce(albumEntry, (draftState: AlbumEntry) => {
            draftState.loadStatus = loadStatus;
        });
        this.#albums.set(path, newAlbumEntry);
    }

    #getLoadStatus(path: string): AlbumLoadStatus {
        const album = this.#albums.get(path);
        if (!album) throw new Error(`Album not found [${path}]`);
        return album.loadStatus;
    }

    setUpdateStatus(path: string, status: AlbumUpdateStatus): void {
        this.#albumUpdateStatuses.set(path, status);
    }

    /**
     * Get the read-write version of the album,
     * creating a stand-in if it doesn't exist.
     *
     * @param path path of the album
     */
    #getOrCreateWritableStore(path: string): AlbumEntry {
        let albumEntry = this.#albums.get(path);

        // If the album wasn't found in memory
        if (!albumEntry) {
            console.log(`Album [${path}] not found in memory`);
            // Create blank entry so that consumers have some object
            // to which they can subscribe to changes
            albumEntry = {
                loadStatus: AlbumLoadStatus.NOT_LOADED,
            };
        }

        return albumEntry;
    }

    /**
     * Remove album from client.
     * This assumes that the album has already been deleted from the server.
     */
    async removeFromMemoryAndDisk(albumPath: string) {
        if (!isValidAlbumPath(albumPath)) throw new Error(`Invalid album path [${albumPath}]`);

        // Delete from disk
        const idbKey = this.#idbKey(albumPath);
        await delFromIdb(idbKey);
        console.log(`Album [${albumPath}] removed from disk`);

        // Delete from memory
        this.#albums.delete(albumPath);
        console.log(`Album [${albumPath}] removed from memory`);
    }
}
export const albumStore = new AlbumStore();
