/**
 * Svelte store of album create state.
 * This store will be empty unless there's an album create in progress.
 */

import { isValidAlbumPath } from '$lib/utils/galleryPathUtils';
import { writable, type Readable, derived } from 'svelte/store';
import { produce, enableMapSet } from 'immer';
import { createUrl } from '$lib/utils/config';
import { toast } from '@zerodevx/svelte-toast';

enableMapSet();

/**
 * Key is the album path
 */
type AlbumCreateStore = Map<string, AlbumCreateEntry>;

/**
 * An entry in the create store
 * Represents a single album being created
 */
export type AlbumCreateEntry = {
    status: CreateState;
};

export enum CreateState {
    IN_PROGRESS = 'In Progress',
}

const initialState: AlbumCreateStore = new Map();
const createStore = writable<AlbumCreateStore>(initialState);

/**
 * Get the create state of the specified album.
 * Will be undefined if the album isn't being created.
 */
export function getAlbumCreateEntry(albumPath: string): Readable<AlbumCreateEntry | undefined> {
    // Derive a read-only Svelte store over the create
    return derived(createStore, ($store) => $store.get(albumPath));
}

function addCreateEntry(albumPath: string): void {
    const createEntry: AlbumCreateEntry = {
        status: CreateState.IN_PROGRESS,
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

//
// Above this is the Svelte store
// Below this is the album create functionality,
// which relies on the data store but is separate.
// They're in the same file to encapsulate the system, so that I don't have
// to expose the mutator methods on the data store to the rest of the system
//

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
