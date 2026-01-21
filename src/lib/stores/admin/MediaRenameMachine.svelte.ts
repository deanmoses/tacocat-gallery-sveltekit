import { RenameStatus } from '$lib/models/album';
import { renameMediaUrl } from '$lib/utils/config';
import { adminApi } from '$lib/utils/adminApi';
import { getNameFromPath, getParentFromPath, isValidMediaPath } from '$lib/utils/galleryPathUtils';
import { toast } from '@zerodevx/svelte-toast';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { albumState } from '../AlbumState.svelte';

/**
 * Media rename state machine
 */
class MediaRenameMachine {
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

    renameMediaItem(oldPath: string, newPath: string): void {
        this.#renameMediaItem(oldPath, newPath); // call async logic in a fire-and-forget manner
    }

    #renameStarted(oldPath: string, newPath: string): void {
        albumState.mediaRenames.set(oldPath, {
            oldPath,
            newPath,
            status: RenameStatus.IN_PROGRESS,
        });
    }

    #success(oldPath: string): void {
        albumState.mediaRenames.delete(oldPath);
    }

    #error(oldPath: string, newPath: string, errorMessage: string): void {
        console.error(`Error renaming ${oldPath} to ${newPath}: ${errorMessage}`);
        albumState.mediaRenames.delete(oldPath);
        toast.push(`Error renaming file: ${errorMessage}`);
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

    async #renameMediaItem(oldMediaPath: string, newMediaPath: string) {
        try {
            if (!isValidMediaPath(oldMediaPath)) throw new Error(`Invalid media path [${oldMediaPath}]`);
            if (!isValidMediaPath(newMediaPath)) throw new Error(`Invalid media path [${newMediaPath}]`);
            const albumPath = getParentFromPath(newMediaPath);
            const album = albumState.albums.get(albumPath)?.album;
            if (!album) throw new Error(`Album [${albumPath}] not loaded`);
            const newName = getNameFromPath(newMediaPath);
            console.log(`Renaming [${oldMediaPath}] to [${newName}]...`);
            this.#renameStarted(oldMediaPath, newMediaPath);
            const response = await adminApi.post(renameMediaUrl(oldMediaPath), { newName });
            if (!response.ok) {
                const json = await response.json().catch(() => ({}));
                throw new Error(json?.errorMessage || response.statusText);
            }
            await albumLoadMachine.fetchFromServer(albumPath); // update the album
            this.#success(oldMediaPath);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.#error(oldMediaPath, newMediaPath, msg);
        }
    }
}
export const mediaRenameMachine = new MediaRenameMachine();
