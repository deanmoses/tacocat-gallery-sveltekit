import { DeleteStatus } from '$lib/models/album';
import { deleteUrl } from '$lib/utils/config';
import { getParentFromPath, isValidAlbumPath } from '$lib/utils/galleryPathUtils';
import { toast } from '@zerodevx/svelte-toast';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { albumState } from '../AlbumState.svelte';

/**
 * Album delete state machine
 */
class AlbumDeleteMachine {
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

    deleteAlbum(albumPath: string): void {
        this.#deleteAlbum(albumPath); // call async logic in a fire-and-forget manner
    }

    #deleteStarted(albumPath: string): void {
        albumState.albumDeletes.set(albumPath, {
            status: DeleteStatus.IN_PROGRESS,
        });
    }

    #success(albumPath: string): void {
        console.log(`Album [${albumPath}] deleted`);
        albumState.albumDeletes.delete(albumPath);
        toast.push(`Album [${albumPath}] deleted`);
    }

    #error(albumPath: string, errorMessage: string): void {
        albumState.albumDeletes.delete(albumPath);
        toast.push(`Error deleting album: ${errorMessage}`);
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

    async #deleteAlbum(albumPath: string): Promise<void> {
        try {
            if (!isValidAlbumPath(albumPath)) throw new Error(`Invalid album path [${albumPath}]`);
            this.#deleteStarted(albumPath);
            const response = await fetch(deleteUrl(albumPath), {
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
            await albumLoadMachine.removeFromMemoryAndDisk(albumPath);
            await albumLoadMachine.fetchFromServer(getParentFromPath(albumPath)); // reload parent album
            this.#success(albumPath);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.#error(albumPath, msg);
        }
    }
}
export const albumDeleteMachine = new AlbumDeleteMachine();
