/**
 * Svelte store of album delete state.
 * This store will be empty unless there's an album delete in progress.
 */

import { isValidAlbumPath } from '$lib/utils/galleryPathUtils';
import { writable, type Readable, derived } from 'svelte/store';
import { albumStore } from './AlbumStore';
import { produce, enableMapSet } from 'immer';
import { deleteUrl } from '$lib/utils/config';
import { toast } from '@zerodevx/svelte-toast';

enableMapSet();

/**
 * Key is the album path
 */
type AlbumDeleteStore = Map<string, AlbumDeleteEntry>;

/**
 * An entry in the delete store
 * Represents a single album being deleted
 */
export type AlbumDeleteEntry = {
    status: DeleteState;
};

export enum DeleteState {
    IN_PROGRESS = 'In Progress',
}

const initialState: AlbumDeleteStore = new Map();
const deleteStore = writable<AlbumDeleteStore>(initialState);

/**
 * Get the delete state of the specified album.
 * Will be undefined if the album isn't being deleted.
 */
export function getAlbumDeleteEntry(albumPath: string): Readable<AlbumDeleteEntry | undefined> {
    // Derive a read-only Svelte store over the delete
    return derived(deleteStore, ($store) => $store.get(albumPath));
}

function addDeleteEntry(albumPath: string): void {
    const deleteEntry: AlbumDeleteEntry = {
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

//
// Above this is the Svelte data store
// Below this is the album delete functionality,
// which relies on the data store but is separate.
// They're in the same file to encapsulate the system, so that I don't have
// to expose the mutator methods on the data store to the rest of the system
//

/**
 * Delete specified album
 * @param albumPath path to album
 */
export async function deleteAlbum(albumPath: string): Promise<void> {
    if (!isValidAlbumPath(albumPath)) throw new Error(`Invalid album path [${albumPath}]`);
    addDeleteEntry(albumPath);
    const response = await fetch(deleteUrl(albumPath), {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    });
    removeDeleteEntry(albumPath);
    if (!response.ok) {
        console.log(`Error deleting album [${albumPath}]`, response);
        const msg = (await response.json()).errorMessage || response.statusText;
        toast.push(`Error deleting album [${albumPath}]: ${msg}`);
        throw new Error(`Error deleting album [${albumPath}]: ${msg}`);
    }
    console.log(`Album [${albumPath}] deleted`);
    toast.push(`Album [${albumPath}] deleted`);
    // Don't await on this async call; return immediately
    // so that the UI can move off this album's page before
    // the delete happens
    albumStore.removeFromMemoryAndDisk(albumPath);
}
