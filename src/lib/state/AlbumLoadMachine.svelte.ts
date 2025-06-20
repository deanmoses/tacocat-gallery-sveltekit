import { get as getFromIdb, set as setToIdb, del as delFromIdb } from 'idb-keyval';
import { AlbumStatus, ReloadStatus, type AlbumEntry } from '$lib/models/album';
import toAlbum from '$lib/models/impl/AlbumCreator';
import { isValidAlbumPath } from '$lib/utils/galleryPathUtils';
import type { AlbumRecord } from '$lib/models/impl/server';
import { albumUrl } from '$lib/utils/config';
import { albumState } from './AlbumState.svelte';
import type { Album } from '$lib/models/GalleryItemInterfaces';

/**
 * Album loading state machine
 */
class AlbumLoadMachine {
    //
    // STATE TRANSITION METHODS
    // These mutate the state.
    //
    // Characteristics:
    //  - These are the ONLY way to update this state.
    //    These should be the only public methods on this state machine.
    //  - These ONLY update state.
    //    If they have to do any work, like making a server call, they invoke it in an
    //    event-like fire-and-forget fashion, meaning invoke async methods *without* await.
    //  - These are synchronous.
    //    They expectation is that they return near-instantly.
    //  - These return void.
    //    To read this state, use one of the public $derived() fields
    //

    /**
     * Trigger fetching an album.
     *
     * This will:
     * 1) Fetch album from browser's local disk
     * 2) If not on disk, fetch over network
     *
     * You can either await this or not.  If you don't await,
     * it loads in the background.
     *
     * @param path path of the album
     * @param refetch refetch from server even if it's already on disk
     */
    fetch(path: string, refetch = true): void {
        if (!isValidAlbumPath(path)) throw new Error(`Invalid album path [${path}]`);

        const status: AlbumStatus = albumState.albums.get(path)?.status ?? AlbumStatus.NOT_LOADED;

        // Do nothing if the album is already being loaded or reloaded
        if (AlbumStatus.LOADING === status) return;
        if (ReloadStatus.RELOADING == albumState.albumReloads.get(path)) return;

        // If I don't have album in memory
        if (AlbumStatus.LOADED !== status) {
            this.#loadingStarted(path);
            this.#fetchFromDiskAndServer(path); // fire and forget, don't await
        }
        // If I have a copy in memory, but the caller has asked to re-fetch
        else if (refetch) {
            this.#reloadingStarted(path);
            this.fetchFromServer(path); // fire and forget, don't await
        }
    }

    #loadingStarted(path: string): void {
        albumState.albums.set(path, {
            status: AlbumStatus.LOADING,
        });
    }

    #reloadingStarted(path: string): void {
        albumState.albumReloads.set(path, ReloadStatus.RELOADING);
    }

    /**
     * Album was fetched (from disk or server) and found
     *
     * @param path path of the album
     * @param jsonAlbum JSON of the album
     */
    #found(path: string, album: Album): void {
        albumState.albums.set(path, {
            status: AlbumStatus.LOADED,
            album: album,
        });
        albumState.albumReloads.delete(path);
    }

    /**
     * Album was fetched from server but not found
     *
     * @param path path of the album
     */
    #notFound(path: string) {
        console.warn(`Album [${path}] not found on server`);
        albumState.albums.set(path, {
            status: AlbumStatus.DOES_NOT_EXIST,
        });
        albumState.albumReloads.delete(path);
    }

    /**
     * Error happened fetching album from server
     *
     * @param path path of the album
     * @param message error message
     */
    #fetchingErrored(path: string, message: string): void {
        console.error(`Album [${path}] error fetching from server: `, message);
        const status = albumState.albums.get(path)?.status;
        const reloadStatus = albumState.albumReloads.get(path);

        if (AlbumStatus.LOADING === status) this.#loadingErrored(path, message);
        else if (ReloadStatus.RELOADING == reloadStatus) this.#reloadingErrored(path);
        else if (AlbumStatus.LOADED === status) {
            console.log(`Album [${path}] keeping cached version after fetch error`);
        } else console.error('Unexpected load status:', status);
    }

    #loadingErrored(path: string, message: string) {
        albumState.albums.set(path, {
            status: AlbumStatus.LOAD_ERRORED,
            errorMessage: message,
        });
    }

    #reloadingErrored(path: string) {
        albumState.albumReloads.set(path, ReloadStatus.ERROR_RELOADING);
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
     * Fetch album from browser's local disk, then also fetch from server.
     *
     * @param path path of the album
     */
    async #fetchFromDiskAndServer(path: string): Promise<void> {
        try {
            const idbKey = this.#idbKey(path);
            const albumObject: AlbumRecord | undefined = await getFromIdb(idbKey);
            if (albumObject) {
                console.log(`Album [${path}] found in idb`);
                const album = toAlbum(albumObject);
                this.#found(path, album);
            } else {
                console.log(`Album [${path}] not found in idb`);
            }
        } catch (error) {
            console.error(`Album [${path}] error fetching from disk`, error);
        } finally {
            await this.fetchFromServer(path);
        }
    }

    /**
     * Trigger fetching album from server.  Does not look in-memory or on-disk.
     *
     * You can either await this or not.  If you don't await, it loads in the background.
     *
     * @param path path of the album
     */
    async fetchFromServer(path: string): Promise<void> {
        try {
            const response = await fetch(albumUrl(path), this.#buildFetchConfig());
            if (response.status === 404) {
                this.#notFound(path);
                this.#removeFromDisk(path); // Delete album from local disk
            } else if (!response.ok) {
                throw new Error(response.statusText);
            } else {
                const json = await response.json();
                console.log(`Album [${path}] fetched from server`, json);
                const album = toAlbum(json);
                this.#found(path, album); // Put album in memory
                this.#writeToDisk(path, json); // Put album on local disk
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.#fetchingErrored(path, message);
        }
    }

    //
    // OTHER METHODS
    //
    // Because this class was not originally designed as
    // STATE TRANSITION METHODS + SERVICE FUNCTIONS,
    // it has a grab bag of stuff.
    // TODO: rationalize.
    //

    /**
     * Return true if album exists
     */
    async albumExists(path: string): Promise<boolean> {
        if (!isValidAlbumPath(path)) throw new Error(`Invalid album path [${path}]`);

        // First check in memory
        console.log(`Checking if album [${path}] exists in memory`);
        const status = albumState.albums.get(path)?.status ?? AlbumStatus.NOT_LOADED;
        if (AlbumStatus.LOADED === status || AlbumStatus.LOADING === status) {
            return true;
        } else if (AlbumStatus.DOES_NOT_EXIST === status) {
            return false;
        }

        // Then check disk cache
        console.log(`Checking if album [${path}] exists on disk`);
        const idbKey = this.#idbKey(path);
        const albumObject: AlbumRecord | undefined = await getFromIdb(idbKey);
        if (albumObject) {
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

    /**
     * Update the album in the Svelte store and on the browser's local disk cache
     */
    updateAlbumEntry(albumEntry: AlbumEntry): void {
        if (!albumEntry) throw 'Album entry is null';
        if (!albumEntry.album) throw 'Album is null';
        const oldAlbumEntry = albumState.albums.get(albumEntry.album.path);
        if (!oldAlbumEntry) throw 'albumEntryStore is null';
        albumState.albums.set(albumEntry.album.path, albumEntry);
        this.#writeToDisk(albumEntry.album.path, albumEntry.album.json); // Put album in browser's local disk cache
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
        albumState.albums.delete(albumPath);
        console.log(`Album [${albumPath}] removed from memory`);
    }
}
export const albumLoadMachine = new AlbumLoadMachine();
