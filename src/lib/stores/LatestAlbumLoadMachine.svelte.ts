import { del, get as getFromIdb, set as setToIdb } from 'idb-keyval';
import { produce } from 'immer';
import type { Thumbable } from '$lib/models/GalleryItemInterfaces';
import toAlbum from '$lib/models/impl/AlbumCreator';
import { latestAlbumUrl } from '$lib/utils/config';
import type { AlbumRecord } from '$lib/models/impl/server';

export type LatestAlbumThumbnailEntry = {
    thumbnail?: Thumbable;
    status: LatestAlbumThumbnailStatus;
};

export const LatestAlbumThumbnailStatus = {
    NOT_LOADED: 'NOT_LOADED.IDLE',
    LOADING: 'NOT_LOADED.LOADING',
    LOADED: 'LOADED.IDLE',
    RELOADING: 'LOADED.RELOADING',
} as const;

export type LatestAlbumThumbnailStatus = (typeof LatestAlbumThumbnailStatus)[keyof typeof LatestAlbumThumbnailStatus];

/** IndexedDB key where latest album numbnail is stored */
const idbThumbnailKey = 'latest';

/**
 * State machine around loading the thumbnail of the latest album
 */
class LatestAlbumLoadMachine {
    /**
     * Private writable store holding latest album thumbnail
     */
    #entry: LatestAlbumThumbnailEntry = $state({
        status: LatestAlbumThumbnailStatus.NOT_LOADED,
    });

    /**
     * Public read-only store holding latest album thumbnail
     */
    readonly entry: LatestAlbumThumbnailEntry = $derived(this.#entry);

    //
    // STATE TRANSITION METHODS
    // These mutate the store's state.
    //
    // Characteristics:
    //  - These are the ONLY way to update this store's state.
    //    These should be the only public methods on this store.
    //  - These ONLY update state.
    //    If they have to do any work, like making a server call, they invoke it in an
    //    event-like fire-and-forget fashion, meaning invoke async methods *without* await.
    //  - These are synchronous.
    //    They expectation is that they return near-instantly.
    //  - These return void.
    //    To read this store's state, use one of the public $derived() fields
    //

    /**
     * Fetch the latest album thumbnail.
     * Retrieves from the browser's local disk catch and also the server.
     */
    fetch(): void {
        switch (this.#entry.status) {
            case LatestAlbumThumbnailStatus.NOT_LOADED:
                this.#entry = { status: LatestAlbumThumbnailStatus.LOADING };
                this.#fetchFromDiskThenServer(); // call async logic in a fire-and-forget manner
                break;
            case LatestAlbumThumbnailStatus.LOADED:
            case LatestAlbumThumbnailStatus.LOADING:
            case LatestAlbumThumbnailStatus.RELOADING:
                this.#entry = { ...this.#entry, status: LatestAlbumThumbnailStatus.RELOADING };
                this.#fetchFromServer(); // call async logic in a fire-and-forget manner
                break;
            default:
                console.error(`Latest album thumbnail fetch: unexpected status [${this.#entry.status}]`);
        }
    }

    /**
     * Album thumbnail was successfully fetched
     */
    #success(albumThumb: Thumbable): void {
        const newState = produce(this.#entry, (draftState: LatestAlbumThumbnailEntry) => {
            draftState.status = LatestAlbumThumbnailStatus.LOADED;
            draftState.thumbnail = albumThumb;
        });
        this.#entry = newState;
    }

    /**
     * Album thumbnail was not successfully fetched
     */
    #error(error: string): void {
        console.error(`Error fetching latest album thumbnail from server: `, error);
        const status = this.#entry.status;
        switch (status) {
            case LatestAlbumThumbnailStatus.LOADING:
                this.#entry = {
                    status: LatestAlbumThumbnailStatus.NOT_LOADED,
                };
                break;
            case LatestAlbumThumbnailStatus.RELOADING:
                this.#entry.status = LatestAlbumThumbnailStatus.LOADED;
                break;
            default:
                console.error(`Latest album thumbnail load error: unexpected status [${status}]`);
        }
    }

    //
    // SERVICE METHODS
    // These 'do work', like making a server call.
    //
    // Characteristics:
    //  - These are private, meant to only be called by STATE TRANSITION METHODS
    //  - These don't mutate state directly; rather, they call STATE TRANSITION METHODS to do it
    //  - These are generally async
    //  - These don't return values; they return void or Promise<void>
    //

    /**
     * Fetch latest album thumbnail from browser's local disk, then from server
     */
    #fetchFromDiskThenServer(): void {
        getFromIdb(idbThumbnailKey)
            .then((jsonThumbnail) => {
                if (jsonThumbnail) {
                    console.log(`Latest album thumbnail found in idb`);
                    const albumThumb: Thumbable = toAlbum(jsonThumbnail as AlbumRecord);
                    this.#success(albumThumb);
                } else {
                    console.log(`Latest album thumbnail not found in idb`);
                }
            })
            .catch((error) => {
                console.error(`Latest album thumbnail error fetching from disk`, error);
            })
            // Always fetch from server regardless of whether it was found on
            // disk or not
            .finally(() => {
                this.#fetchFromServer();
            });
    }

    /**
     * Fetch latest album thumbnail from server
     */
    #fetchFromServer(): void {
        fetch(latestAlbumUrl())
            .then((response: Response) => {
                if (!response.ok) throw new Error(response.statusText);
                return response.json();
            })
            .then((json) => {
                if (json.error) {
                    this.#error(json.error);
                } else {
                    if (!json || !json.path) {
                        console.warn(`Latest album thumbnail not found on server.  JSON: `, json);
                        this.#error('Latest album thumbnail not found on server');
                        this.#removeFromDisk();
                    } else {
                        console.log(`Latest album thumbnail fetched from server`, json);
                        const albumThumb: Thumbable = toAlbum(json as AlbumRecord);
                        this.#success(albumThumb);
                        this.#writeToDisk(json); // Put thumbnail in browser's local disk cache
                    }
                }
            })
            .catch((error) => {
                this.#error(error);
            });
    }

    /**
     * Store the latest album thumbnail in the browser's local disk storage
     *
     * @param path path of the album
     * @param thumbnailJson JSON of the latestAlbumThumbnail
     */
    #writeToDisk(thumbnailJson: JSON): void {
        // TODO: maybe don't write it if the value is unchanged?
        // Or maybe refresh some sort of last_fetched timestamp?
        setToIdb(idbThumbnailKey, thumbnailJson)
            .then(() => console.log(`Latest album thumbnail stored in idb`))
            .catch((e) => console.error(`Latest album thumbnail error storing in idb`, e));
    }

    /**
     * Remove the latest album thumbnail from the browser's local disk storage
     */
    #removeFromDisk(): void {
        del(idbThumbnailKey);
    }
}
export const latestAlbumLoadMachine = new LatestAlbumLoadMachine();
