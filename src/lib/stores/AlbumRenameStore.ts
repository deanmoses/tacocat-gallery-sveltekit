/**
 * Svelte store of album rename state.
 * This store will be empty unless there's an album rename in progress.
 */

import { getNameFromPath, getParentFromPath, isValidDayAlbumPath } from '$lib/utils/galleryPathUtils';
import { writable, type Readable, derived, get } from 'svelte/store';
import { albumStore } from './AlbumStore';
import { produce, enableMapSet } from 'immer';
import { renameAlbumUrl } from '$lib/utils/config';

enableMapSet();

/**
 * Key is the album path
 */
type AlbumRenameStore = Map<string, AlbumRenameEntry>;

/**
 * An entry in the rename store
 * Represents a single album being renamed
 */
export type AlbumRenameEntry = {
    oldAlbumPath: string;
    newAlbumPath: string;
    status: RenameState;
    errorMessage?: string;
};

export enum RenameState {
    IN_PROGRESS = 'In Progress',
    ERROR = 'Error',
}

const initialState: AlbumRenameStore = new Map();
const renameStore = writable<AlbumRenameStore>(initialState);

/**
 * Get the rename state of the specified album.
 * Will be undefined if the album isn't being renamed.
 */
export function getAlbumRenameEntry(oldAlbumPath: string): Readable<AlbumRenameEntry | undefined> {
    // Derive a read-only Svelte store over the rename
    return derived(renameStore, ($store) => $store.get(oldAlbumPath));
}

function addRename(oldAlbumPath: string, newAlbumPath: string): void {
    const rename: AlbumRenameEntry = {
        oldAlbumPath: oldAlbumPath,
        newAlbumPath: newAlbumPath,
        status: RenameState.IN_PROGRESS,
    };
    renameStore.update((oldValue: AlbumRenameStore) =>
        produce(oldValue, (draftState: AlbumRenameStore) => {
            draftState.set(oldAlbumPath, rename);
            return draftState;
        }),
    );
}

function setError(oldAlbumPath: string, errorMessage: string): void {
    renameStore.update((oldValue: AlbumRenameStore) =>
        produce(oldValue, (draftState: AlbumRenameStore) => {
            const rename = draftState.get(oldAlbumPath);
            if (rename) {
                rename.errorMessage = errorMessage;
                draftState.set(oldAlbumPath, rename);
            }
            return draftState;
        }),
    );
}

function removeRename(oldAlbumPath: string): void {
    renameStore.update((oldValue: AlbumRenameStore) =>
        produce(oldValue, (draftState: AlbumRenameStore) => {
            draftState.delete(oldAlbumPath);
            return draftState;
        }),
    );
}

//
// Above this is the Svelte data store
// Below this is the album renaming functionality,
// which relies on the data store but is separate.
// They're in the same file to encapsulate the system, so that I don't have
// to expose the mutator methods on the data store to the rest of the system
//

/**
 * Rename specified album
 */
export async function renameDayAlbum(oldAlbumPath: string, newAlbumPath: string) {
    if (!isValidDayAlbumPath(oldAlbumPath)) throw new Error(`Invalid old album path [${oldAlbumPath}]`);
    if (!isValidDayAlbumPath(newAlbumPath)) throw new Error(`Invalid new album path [${newAlbumPath}]`);
    const album = get(albumStore.get(oldAlbumPath))?.album;
    if (!album) throw new Error(`Album [${oldAlbumPath}] not loaded`);

    addRename(oldAlbumPath, newAlbumPath);
    console.log(`Attempting to rename album [${oldAlbumPath}] to [${newAlbumPath}]`);
    const newName = getNameFromPath(newAlbumPath);
    const url = renameAlbumUrl(oldAlbumPath);
    const requestConfig: RequestInit = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName }),
    };
    const response = await fetch(url, requestConfig);
    if (!response.ok) {
        console.log(`Error renaming album [${oldAlbumPath}]`, response);
        setError(oldAlbumPath, response.statusText);
    } else {
        // Rename was successful

        // Fetch parent album to get renamed album added to it
        console.log(`Fetching parent album`);
        const parentAlbumPath = getParentFromPath(oldAlbumPath);
        // Do NOT async await because we want the UI to move to
        // the new album now
        albumStore.fetchFromServerAsync(parentAlbumPath);
        console.log(`Fetched parent album`);
        removeRename(oldAlbumPath);

        // Remove old album from album store, but do NOT async await
        // because we want the UI to move away from the old album
        // page before this happens
        console.log(`Removing old album from client`);
        albumStore.removeFromMemoryAndDisk(oldAlbumPath);
        console.log(`Removed old album from client`);
    }
}
