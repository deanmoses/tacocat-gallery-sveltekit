import { ImageStatus } from '$lib/models/album';
import { deleteUrl } from '$lib/utils/config';
import { getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
import { toast } from '@zerodevx/svelte-toast';
import { albumState } from '../AlbumState.svelte';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';

/**
 * Image delete state machine
 */
class ImageDeleteMachine {
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

    delete(imagePath: string): void {
        this.#deleteImage(imagePath); // call async logic in a fire-and-forget manner
    }

    #deleteStarted(imagePath: string): void {
        albumState.images.set(imagePath, {
            status: ImageStatus.DELETING,
        });
    }

    #success(imagePath: string): void {
        albumState.images.delete(imagePath);
    }

    #error(imagePath: string, errorMessage: string): void {
        albumState.images.delete(imagePath);
        toast.push(`Error deleting ${imagePath}: ${errorMessage}`);
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

    async #deleteImage(imagePath: string) {
        try {
            if (!isValidImagePath(imagePath)) throw new Error(`Invalid image path [${imagePath}]`);
            this.#deleteStarted(imagePath);
            const response = await fetch(deleteUrl(imagePath), {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                const msg = (await response.json()).errorMessage || response.statusText;
                throw new Error(msg);
            }
            console.log(`Image [${imagePath}] deleted`);
            // reload the album
            await albumLoadMachine.fetchFromServer(getParentFromPath(imagePath));
            this.#success(imagePath);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.#error(imagePath, msg);
        }
    }
}
export const imageDeleteMachine = new ImageDeleteMachine();
