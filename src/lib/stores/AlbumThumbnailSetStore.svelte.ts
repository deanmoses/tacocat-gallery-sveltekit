import { SvelteMap } from 'svelte/reactivity';
import { albumStore } from './AlbumStore.svelte';
import { AlbumUpdateStatus } from '$lib/models/album';
import { setThumbnailUrl } from '$lib/utils/config';
import { toast } from '@zerodevx/svelte-toast';
import { getParentFromPath, isValidYearAlbumPath } from '$lib/utils/galleryPathUtils';

/**
 * Represents the state of an album's thumbnail being set
 */
export type AlbumThumbnailSetEntry = {
    albumPath: string;
    newThumbnailImagePath: string;
    status: AlbumThumbnailSetStatus;
};

/**
 * Status of setting the album's thumbnail
 */
export enum AlbumThumbnailSetStatus {
    IN_PROGRESS = 'In Progress',
}

/**
 * Store of album thumbnail set states
 */
class AlbumThumbnailSetStore {
    /**
     * Private writable store
     */
    #state = new SvelteMap<string, AlbumThumbnailSetEntry>();

    /**
     * Public read-only version of store
     */
    readonly state: ReadonlyMap<string, AlbumThumbnailSetEntry> = $derived(this.#state);

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
     * Set specified thumbnail as specified album's thumbnail
     *
     * @param albumPath path of album on which to set the thumbnail
     * @param newThumbnailImagePath path of image, like '/2001/12-31/image.jpg'
     */
    setAlbumThumbnail(albumPath: string, newThumbnailImagePath: string): void {
        this.#state.set(albumPath, {
            albumPath,
            newThumbnailImagePath,
            status: AlbumThumbnailSetStatus.IN_PROGRESS,
        });
        albumStore.setUpdateStatus(albumPath, AlbumUpdateStatus.UPDATING);

        // Call the async logic in a fire-and-forget manner
        this.#setAlbumThumbnail(albumPath, newThumbnailImagePath);
    }

    #success(albumPath: string) {
        this.#state.delete(albumPath);
        albumStore.setUpdateStatus(albumPath, AlbumUpdateStatus.NOT_UPDATING);

        if (isValidYearAlbumPath(albumPath)) {
            const year = albumPath.replaceAll('/', '');
            toast.push(`Thumnbnail set for ${year}`);
        }
    }

    #error(albumPath: string, errorMessage: string) {
        console.log(`Error saving thumbnail for album [${albumPath}]: ${errorMessage}`);
        this.#state.delete(albumPath);
        albumStore.setUpdateStatus(albumPath, AlbumUpdateStatus.NOT_UPDATING);
        toast.push(`Error saving thumbnail: ${errorMessage}`);
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

    async #setAlbumThumbnail(albumPath: string, newThumbnailImagePath: string): Promise<void> {
        console.log(`Setting thumbnail of album [${albumPath}] to [${newThumbnailImagePath}]`);
        try {
            const response = await fetch(setThumbnailUrl(albumPath), {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newThumbnailImagePath }),
            });
            if (!response.ok) {
                const msg = (await response.json()).errorMessage || response.statusText;
                throw new Error(msg);
            }
            console.log(`Set thumbnail of album [${albumPath}] to [${newThumbnailImagePath}]`);
            console.log(`Reloading album [${albumPath}] from server`);
            await albumStore.fetchFromServer(albumPath);
            console.log(`Reloading parent album [${getParentFromPath(albumPath)}] from server`);
            await albumStore.fetchFromServer(getParentFromPath(albumPath));
            this.#success(albumPath);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.#error(albumPath, msg);
        }
    }
}
export const albumThumbnailSetStore = new AlbumThumbnailSetStore();
