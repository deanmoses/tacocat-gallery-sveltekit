import { toast } from '@zerodevx/svelte-toast';
import { getParentFromPath, isValidAlbumPath } from '$lib/utils/galleryPathUtils';
import { createUrl } from '$lib/utils/config';
import { albumState } from '../AlbumState.svelte';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { AlbumStatus } from '$lib/models/album';

/**
 * Album create state machine
 */
class AlbumCreateMachine {
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

    createAlbum(albumPath: string): void {
        // album must be in a status that starts with NOT_LOADED.IDLE or DOES_NOT_EXIST.IDLE
        const status = albumState.albums.get(albumPath)?.status;
        if (!status?.startsWith(AlbumStatus.NOT_LOADED) && !status?.startsWith(AlbumStatus.DOES_NOT_EXIST))
            throw new Error(`Album already exists`);
        this.#createAlbum(albumPath); // call async logic in a fire-and-forget manner
    }

    #createStarted(albumPath: string) {
        albumState.albums.set(albumPath, {
            status: AlbumStatus.CREATING,
        });
    }

    #success(albumPath: string) {
        console.log(`Album [${albumPath}] created`);
        // Do not change state here; it happens by virtue of loading the album from server
        toast.push(`Album [${albumPath}] created`);
    }

    #error(albumPath: string, errorMessage: string) {
        console.error(`Error creating album ${albumPath}: ${errorMessage}`);
        albumState.albums.set(albumPath, {
            status: AlbumStatus.CREATE_ERRORED,
            errorMessage,
        });
        toast.push(`Error creating album: ${errorMessage}`);
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

    async #createAlbum(albumPath: string): Promise<void> {
        try {
            if (!isValidAlbumPath(albumPath)) throw new Error(`Invalid album path [${albumPath}]`);
            this.#createStarted(albumPath);
            const response = await fetch(createUrl(albumPath), {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });
            if (!response.ok) {
                const msg = (await response.json()).errorMessage || response.statusText;
                throw new Error(msg);
            }
            await albumLoadMachine.fetchFromServer(albumPath); // load newly created album
            this.#success(albumPath);
            await albumLoadMachine.fetchFromServer(getParentFromPath(albumPath)); // reload parent album
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.#error(albumPath, msg);
        }
    }
}
export const albumCreateMachine = new AlbumCreateMachine();
