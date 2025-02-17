import { RenameStatus } from '$lib/models/album';
import { renameImageUrl } from '$lib/utils/config';
import { getNameFromPath, getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
import { toast } from '@zerodevx/svelte-toast';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { albumState } from '../AlbumState.svelte';

/**
 * Image rename state machine
 */
class ImageRenameMachine {
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

    renameImage(oldImagePath: string, newImagePath: string): void {
        this.#renameImage(oldImagePath, newImagePath); // call async logic in a fire-and-forget manner
    }

    #renameStarted(oldPath: string, newPath: string): void {
        albumState.imageRenames.set(oldPath, {
            oldPath,
            newPath,
            status: RenameStatus.IN_PROGRESS,
        });
    }

    #success(oldImagePath: string): void {
        albumState.imageRenames.delete(oldImagePath);
    }

    #error(oldImagePath: string, newImagePath: string, errorMessage: string): void {
        console.error(`Error renaming ${oldImagePath} to ${newImagePath}: ${errorMessage}`);
        albumState.imageRenames.delete(oldImagePath);
        toast.push(`Error renaming image: ${errorMessage}`);
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

    async #renameImage(oldImagePath: string, newImagePath: string) {
        try {
            if (!isValidImagePath(oldImagePath)) throw new Error(`Invalid image path [${oldImagePath}]`);
            if (!isValidImagePath(newImagePath)) throw new Error(`Invalid image path [${newImagePath}]`);
            const albumPath = getParentFromPath(newImagePath);
            const album = albumState.albums.get(albumPath)?.album;
            if (!album) throw new Error(`Album [${albumPath}] not loaded`);
            const newName = getNameFromPath(newImagePath);
            console.log(`Renaming image [${oldImagePath}] to [${newName}]...`);
            this.#renameStarted(oldImagePath, newImagePath);
            const response = await fetch(renameImageUrl(oldImagePath), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newName }),
            });
            if (!response.ok) {
                const msg = (await response.json()).errorMessage || response.statusText;
                throw msg;
            }
            await albumLoadMachine.fetchFromServer(albumPath); // update the album
            this.#success(oldImagePath);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.#error(oldImagePath, newImagePath, msg);
        }
    }
}
export const imageRenameMachine = new ImageRenameMachine();
