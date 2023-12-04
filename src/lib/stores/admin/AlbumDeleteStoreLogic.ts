import { produce } from 'immer';
import { toast } from '@zerodevx/svelte-toast';
import { albumStore } from '../AlbumStore';
import { isValidAlbumPath } from '$lib/utils/galleryPathUtils';
import { deleteUrl } from '$lib/utils/config';
import { deleteStore, type AlbumDeleteStore } from '../AlbumDeleteStore';
import { DeleteState, type DeleteEntry } from '$lib/models/album';

/**
 * Delete specified album
 * @param albumPath path to album
 */
export async function deleteAlbum(albumPath: string): Promise<void> {
    if (!isValidAlbumPath(albumPath)) throw new Error(`Invalid album path [${albumPath}]`);
    addDeleteEntry(albumPath);
    const response = await fetch(deleteUrl(albumPath), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });
    removeDeleteEntry(albumPath);
    if (!response.ok) {
        const msg = (await response.json()).errorMessage || response.statusText;
        toast.push(`Error deleting: ${msg}`);
        throw new Error(`Error deleting: ${msg}`);
    }
    console.log(`Album [${albumPath}] deleted`);
    toast.push(`Album [${albumPath}] deleted`);
    // Don't await on this async call; return immediately
    // so that the UI can move off this album's page before
    // the delete happens
    albumStore.removeFromMemoryAndDisk(albumPath);
}

///////////////////////////////////////////////////////////////////////////////
// Svelte store mutators
///////////////////////////////////////////////////////////////////////////////

function addDeleteEntry(albumPath: string): void {
    const deleteEntry: DeleteEntry = {
        status: DeleteState.IN_PROGRESS,
    };
    deleteStore.update((oldState: AlbumDeleteStore) =>
        produce(oldState, (draftState: AlbumDeleteStore) => {
            draftState.set(albumPath, deleteEntry);
            return draftState;
        }),
    );
}

function removeDeleteEntry(albumPath: string): void {
    deleteStore.update((oldState: AlbumDeleteStore) =>
        produce(oldState, (draftState: AlbumDeleteStore) => {
            draftState.delete(albumPath);
            return draftState;
        }),
    );
}
