import { produce } from 'immer';
import { toast } from '@zerodevx/svelte-toast';
import { isValidAlbumPath } from '$lib/utils/galleryPathUtils';
import { createUrl } from '$lib/utils/config';
import { createStore, type AlbumCreateStore } from '../AlbumCreateStore';
import { AlbumCreateState, type AlbumCreateEntry } from '$lib/models/album';

/**
 * Create specified album
 */
export async function createAlbum(albumPath: string) {
    if (!isValidAlbumPath(albumPath)) throw new Error(`Invalid album path [${albumPath}]`);
    addCreateEntry(albumPath);
    const response = await fetch(createUrl(albumPath), {
        method: 'PUT',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    });
    removeCreateEntry(albumPath);
    if (!response.ok) {
        const msg = (await response.json()).errorMessage || response.statusText;
        toast.push(`Error creating: ${msg}`);
        throw new Error(`Error creating: ${msg}`);
    }
    console.log(`Album [${albumPath}] created`);
    toast.push(`Album [${albumPath}] created`);
}

///////////////////////////////////////////////////////////////////////////////
// Svelte store mutators
///////////////////////////////////////////////////////////////////////////////

function addCreateEntry(albumPath: string): void {
    const createEntry: AlbumCreateEntry = {
        status: AlbumCreateState.IN_PROGRESS,
    };
    createStore.update((oldState: AlbumCreateStore) =>
        produce(oldState, (draftState: AlbumCreateStore) => {
            draftState.set(albumPath, createEntry);
            return draftState;
        }),
    );
}

function removeCreateEntry(albumPath: string): void {
    createStore.update((oldState: AlbumCreateStore) =>
        produce(oldState, (draftState: AlbumCreateStore) => {
            draftState.delete(albumPath);
            return draftState;
        }),
    );
}
