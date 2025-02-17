import { del, get as getFromIdb, set as setToIdb } from 'idb-keyval';
import { produce } from 'immer';
import { AlbumLoadStatus } from '$lib/models/album';
import type { Thumbable } from '$lib/models/GalleryItemInterfaces';
import toAlbum from '$lib/models/impl/AlbumCreator';
import { latestAlbumUrl } from '$lib/utils/config';
import type { AlbumRecord } from '$lib/models/impl/server';

export type LatestAlbumThumbnailEntry = {
    thumbnail?: Thumbable;
    status: AlbumLoadStatus;
};

const initialStoreState = {
    status: AlbumLoadStatus.NOT_LOADED,
};

/** IndexedDB key where latest album numbnail is stored */
const idbThumbnailKey = 'latest';

/**
 * State machine around loading the thumbnail of the latest album
 */
class LatestAlbumLoadMachine {
    /**
     * Private writable store holding latest album thumbnail
     */
    #entry: LatestAlbumThumbnailEntry = $state(initialStoreState);

    /**
     * Public read-only store holding latest album thumbnail
     */
    readonly entry: LatestAlbumThumbnailEntry = $derived(this.#entry);

    /**
     * Get the latest thumbnail.
     *
     * Fetches from the browser's local disk catch and also the server.
     *
     * @returns Svelte store with latest thumbnail
     */
    async fetch(): Promise<void> {
        // I don't have a copy in memory.  Go fetch it.
        if (AlbumLoadStatus.NOT_LOADED === this.#entry.status) {
            this.#setLoadStatus(AlbumLoadStatus.LOADING);
            this.#fetchFromDiskThenServer();
        }
        // Else I already have a copy in memory.  Refetch if I'm not already fetching
        else if (AlbumLoadStatus.LOADING !== this.#entry.status) {
            this.#fetchFromServer();
        }
    }

    /**
     * Fetch thumbnail
     * from browser's local disk,
     * then fetch from server
     */
    #fetchFromDiskThenServer(): void {
        getFromIdb(idbThumbnailKey)
            .then((jsonThumbnail) => {
                if (jsonThumbnail) {
                    console.log(`Latest album thumbnail found in idb`);
                    this.#setLatestAlbumThumbnail(jsonThumbnail); // Put album in Svelte store
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
                    this.#handleFetchError(json.error);
                } else {
                    if (!json || !json.path) {
                        console.warn(`Latest album thumbnail not found on server.  JSON: `, json);
                        this.#removeFromMemory();
                        this.#removeFromDisk();
                    } else {
                        console.log(`Latest album thumbnail fetched from server`, json);
                        this.#setLatestAlbumThumbnail(json); // Put thumbnail in Svelte store
                        this.#writeToDisk(json); // Put thumbnail in browser's local disk cache
                    }
                }
            })
            .catch((error) => {
                this.#handleFetchError(error);
            });
    }

    /**
     *
     */
    #handleFetchError(error: string): void {
        console.error(`Latest album thumbnail error fetching from server: `, error);

        const status = this.#entry.status;
        switch (status) {
            case AlbumLoadStatus.LOADING:
            case AlbumLoadStatus.NOT_LOADED:
            case AlbumLoadStatus.DOES_NOT_EXIST:
                this.#setLoadStatus(AlbumLoadStatus.ERROR_LOADING);
                break;
            case AlbumLoadStatus.LOADED:
                break;
            case AlbumLoadStatus.ERROR_LOADING:
                // already in correct state
                break;
            default:
                console.error('Unexepected load status:', status);
        }
    }

    /**
     *
     */
    #setLoadStatus(loadStatus: AlbumLoadStatus): void {
        const newState = produce(this.#entry, (draftState: LatestAlbumThumbnailEntry) => {
            draftState.status = loadStatus;
        });
        this.#entry = newState;
    }

    /**
     * Store the latest album thumbnail in my Svelte store
     */
    #setLatestAlbumThumbnail(json: unknown): void {
        const albumThumb: Thumbable = toAlbum(json as AlbumRecord);
        const newState = produce(this.#entry, (draftState: LatestAlbumThumbnailEntry) => {
            draftState.status = AlbumLoadStatus.LOADED;
            draftState.thumbnail = albumThumb;
        });
        this.#entry = newState;
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
     * Remove the latest album thumbnail from memory
     */
    #removeFromMemory(): void {
        this.#entry = initialStoreState;
    }

    /**
     * Remove the latest album thumbnail from the browser's local disk storage
     */
    #removeFromDisk(): void {
        del(idbThumbnailKey);
    }
}
export const latestAlbumLoadMachine = new LatestAlbumLoadMachine();
