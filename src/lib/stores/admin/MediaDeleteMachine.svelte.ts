import { DeleteStatus } from '$lib/models/album';
import { deleteUrl } from '$lib/utils/config';
import { adminApi } from '$lib/utils/adminApi';
import { getParentFromPath, isValidMediaPath } from '$lib/utils/galleryPathUtils';
import { toast } from '@zerodevx/svelte-toast';
import { albumState } from '../AlbumState.svelte';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';

/**
 * Media delete state machine
 */
class MediaDeleteMachine {
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

    delete(mediaPath: string): void {
        this.#deleteMediaItem(mediaPath); // call async logic in a fire-and-forget manner
    }

    #deleteStarted(mediaPath: string): void {
        albumState.mediaDeletes.set(mediaPath, {
            status: DeleteStatus.IN_PROGRESS,
        });
    }

    #success(mediaPath: string): void {
        albumState.mediaDeletes.delete(mediaPath);
    }

    #error(mediaPath: string, errorMessage: string): void {
        albumState.mediaDeletes.delete(mediaPath);
        toast.push(`Error deleting ${mediaPath}: ${errorMessage}`);
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

    async #deleteMediaItem(mediaPath: string) {
        try {
            if (!isValidMediaPath(mediaPath)) throw new Error(`Invalid media path [${mediaPath}]`);
            this.#deleteStarted(mediaPath);
            const response = await adminApi.delete(deleteUrl(mediaPath));
            if (!response.ok) {
                const json = await response.json().catch(() => ({}));
                throw new Error(json?.errorMessage || response.statusText);
            }
            console.log(`Media [${mediaPath}] deleted`);
            // reload the album
            await albumLoadMachine.fetchFromServer(getParentFromPath(mediaPath));
            this.#success(mediaPath);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.#error(mediaPath, msg);
        }
    }
}
export const mediaDeleteMachine = new MediaDeleteMachine();
