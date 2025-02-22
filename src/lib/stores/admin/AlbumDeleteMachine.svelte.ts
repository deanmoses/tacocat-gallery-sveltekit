import { AlbumStatus } from '$lib/models/album';
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

    delete(albumPath: string): void {
        const status = albumState.albums.get(albumPath)?.status;
        // album must be in a status that starts with LOADED.IDLE
        if (!status?.startsWith(AlbumStatus.LOADED))
            throw new Error(`Album [${albumPath}] in invalid status to delete: [${status}]`);
        this.#delete(albumPath); // call async logic in a fire-and-forget manner
    }

    #deleteStarted(albumPath: string): void {
        // TODO: use immer to set state immutably
        const albumEntry = albumState.albums.get(albumPath);
        if (!albumEntry) throw new Error(`No album at path [${albumPath}]`);
        albumEntry.status = AlbumStatus.DELETING;
        albumState.albums.set(albumPath, albumEntry);
    }

    #success(albumPath: string): void {
        console.log(`Album [${albumPath}] deleted`);

        albumState.albums.set(albumPath, {
            status: AlbumStatus.DELETED,
        });

        toast.push(`Album deleted`);
    }

    #error(albumPath: string, errorMessage: string): void {
        // TODO: use immer to set state immutably
        const albumEntry = albumState.albums.get(albumPath);
        if (!albumEntry) throw new Error(`No album at path [${albumPath}]`);
        albumEntry.status = AlbumStatus.DELETE_ERRORED;
        albumEntry.errorMessage = errorMessage;
        albumState.albums.set(albumPath, albumEntry);

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

    async #delete(albumPath: string): Promise<void> {
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
