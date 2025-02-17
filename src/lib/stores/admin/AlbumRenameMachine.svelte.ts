import { RenameStatus } from '$lib/models/album';
import { renameAlbumUrl } from '$lib/utils/config';
import { getNameFromPath, getParentFromPath, isValidDayAlbumPath } from '$lib/utils/galleryPathUtils';
import { toast } from '@zerodevx/svelte-toast';
import { albumStore } from '../AlbumStore.svelte';
import { globalStore } from '../GlobalStore.svelte';

/**
 * Album rename state machine
 */
class AlbumRenameMachine {
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

    renameDayAlbum(oldAlbumPath: string, newAlbumPath: string): void {
        this.#renameDayAlbum(oldAlbumPath, newAlbumPath); // call async logic in a fire-and-forget manner
    }

    #renameStarted(oldPath: string, newPath: string): void {
        globalStore.albumRenames.set(oldPath, {
            oldPath: oldPath,
            newPath: newPath,
            status: RenameStatus.IN_PROGRESS,
        });
    }

    #success(oldAlbumPath: string): void {
        globalStore.albumRenames.delete(oldAlbumPath);
    }

    #error(oldAlbumPath: string, newAlbumPath: string, errorMessage: string): void {
        console.error(`Error renaming album [${oldAlbumPath}] to [${newAlbumPath}]: ${errorMessage}`);
        globalStore.albumRenames.delete(oldAlbumPath);
        toast.push(`Error renaming album: ${errorMessage}`);
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

    async #renameDayAlbum(oldAlbumPath: string, newAlbumPath: string): Promise<void> {
        try {
            if (!isValidDayAlbumPath(oldAlbumPath)) throw new Error(`Invalid old album path [${oldAlbumPath}]`);
            if (!isValidDayAlbumPath(newAlbumPath)) throw new Error(`Invalid new album path [${newAlbumPath}]`);
            const album = albumStore.albums.get(oldAlbumPath)?.album;
            if (!album) throw new Error(`Album [${oldAlbumPath}] not loaded`);
            const newName = getNameFromPath(newAlbumPath);
            console.log(`Renaming album [${oldAlbumPath}] to [${newName}]...`);
            this.#renameStarted(oldAlbumPath, newAlbumPath);
            const response = await fetch(renameAlbumUrl(oldAlbumPath), {
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
            // Fetch parent album to get renamed album added to it
            // Do NOT async await because we want the UI to move to
            // the new album now
            const parentAlbumPath = getParentFromPath(oldAlbumPath);
            albumStore.fetchFromServer(parentAlbumPath);
            // Remove old album from album store, but do NOT async await
            // because we want the UI to move away from the old album first
            albumStore.removeFromMemoryAndDisk(oldAlbumPath);
            this.#success(oldAlbumPath);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.#error(oldAlbumPath, newAlbumPath, msg);
        }
    }
}
export const albumRenameMachine = new AlbumRenameMachine();
