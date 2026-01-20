import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { recropThumbnailUrl } from '$lib/utils/config';
import { adminApi } from '$lib/utils/adminApi';
import { toast } from '@zerodevx/svelte-toast';
import { getParentFromPath } from '$lib/utils/galleryPathUtils';
import { albumState } from '../AlbumState.svelte';
import { CropStatus, type Crop } from '$lib/models/album';

/**
 * Thumbnail crop state machine
 */
class CropMachine {
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
     * Crop the thumbnail
     */
    crop(mediaPath: string, crop: Crop): void {
        console.log(`Saving crop of [${mediaPath}]`, crop);
        albumState.crops.set(mediaPath, {
            mediaPath: mediaPath,
            crop,
            status: CropStatus.IN_PROGRESS,
        });
        this.#crop(mediaPath, crop); // call async logic in a fire-and-forget manner
    }

    #success(mediaPath: string) {
        albumState.crops.delete(mediaPath);
        toast.push(`Thumbnail cropped`);
    }

    #error(mediaPath: string, errorMessage: string) {
        console.log(`Error cropping thumbnail for [${mediaPath}]: ${errorMessage}`);
        albumState.crops.delete(mediaPath);
        toast.push(`Error cropping thumbnail: ${errorMessage}`);
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

    async #crop(mediaPath: string, crop: Crop): Promise<void> {
        try {
            // Make the save request
            const response = await adminApi.patch(recropThumbnailUrl(mediaPath), crop);

            // Check for errors
            if (!response.ok) {
                const json = await response.json().catch(() => ({}));
                throw new Error(json?.errorMessage || response.statusText);
            }

            console.log(`Updated thumbnail of [${mediaPath}]`);

            // Reload parent album to:
            //  1) get the media item's new thumbnail
            //  2) this media item may be the album's thumb
            const albumPath = getParentFromPath(mediaPath);
            console.log(`Reloading album [${albumPath}] from server`);
            await albumLoadMachine.fetchFromServer(albumPath); // force reload from server

            // Reload year album because this media item may be the year's thumb
            // TODO: not doing yet because back end isn't setting year's thumb yet
            // console.log(`Reloading parent album [${getParentFromPath(albumPath)}] from server`);
            // await albumStore.fetchFromServer(getParentFromPath(albumPath)); // force reload from server

            this.#success(mediaPath);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.#error(mediaPath, msg);
        }
    }
}
export const cropMachine = new CropMachine();
