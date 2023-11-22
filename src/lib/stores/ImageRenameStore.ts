/**
 * Svelte store of image rename state.
 * This store will be empty unless there's an image rename in progress.
 */

import { renameImageUrl } from '$lib/utils/config';
import { getNameFromPath, getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
import { writable, type Readable, derived, get } from 'svelte/store';
import { albumStore } from './AlbumStore';
import { produce, enableMapSet } from 'immer';

enableMapSet();

/**
 * Key is the image path
 */
type ImageRenameStore = Map<string, RenameEntry>;

/**
 * An entry in the rename store
 * Represents a single image being renamed
 */
export type RenameEntry = {
    oldImagePath: string;
    newImagePath: string;
    status: RenameState;
    errorMessage?: string;
};

export enum RenameState {
    IN_PROGRESS = 'In Progress',
    ERROR = 'Error',
}

const initialState: ImageRenameStore = new Map();
const renameStore = writable<ImageRenameStore>(initialState);

/**
 * Get the rename state of the specified image.
 * Will be undefined if the image isn't being renamed.
 */
export function getImageRenameStatus(imagePath: string): Readable<RenameEntry | undefined> {
    // Derive a read-only Svelte store over the rename
    return derived(renameStore, ($store) => $store.get(imagePath));
}

function addRename(oldImagePath: string, newImagePath: string): void {
    const rename: RenameEntry = {
        oldImagePath,
        newImagePath,
        status: RenameState.IN_PROGRESS,
    };
    renameStore.update((oldValue: ImageRenameStore) =>
        produce(oldValue, (draftState: ImageRenameStore) => {
            draftState.set(oldImagePath, rename);
            return draftState;
        }),
    );
}

function setError(oldImagePath: string, errorMessage: string): void {
    renameStore.update((oldValue: ImageRenameStore) =>
        produce(oldValue, (draftState: ImageRenameStore) => {
            const rename = draftState.get(oldImagePath);
            if (rename) {
                rename.status = RenameState.ERROR;
                rename.errorMessage = errorMessage;
                draftState.set(oldImagePath, rename);
            }
            return draftState;
        }),
    );
}

function removeRename(oldImagePath: string): void {
    renameStore.update((oldValue: ImageRenameStore) =>
        produce(oldValue, (draftState: ImageRenameStore) => {
            draftState.delete(oldImagePath);
            return draftState;
        }),
    );
}

//
// Above this is the Svelte data store
// Below this is the image renaming functionality,
// which relies on the data store but is separate.
// They're in the same file to encapsulate the system, so that I don't have
// to expose the mutator methods on the data store to the rest of the system
//

/**
 * Rename specified image
 */
export async function renameImage(oldImagePath: string, newImagePath: string) {
    if (!isValidImagePath(oldImagePath)) throw new Error(`Invalid image path [${oldImagePath}]`);
    if (!isValidImagePath(newImagePath)) throw new Error(`Invalid image path [${newImagePath}]`);
    const albumPath = getParentFromPath(newImagePath);
    const album = get(albumStore.get(albumPath))?.album;
    if (!album) throw new Error(`Album [${albumPath}] not loaded`);
    addRename(oldImagePath, newImagePath);
    console.log(`Attempting to rename image [${oldImagePath}] to [${newImagePath}]`);
    const newName = getNameFromPath(newImagePath);
    const url = renameImageUrl(oldImagePath);
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
        console.log(`Error renaming image [${oldImagePath}]`, response);
        setError(oldImagePath, response.statusText);
    } else {
        await albumStore.fetchFromServerAsync(albumPath); // this will update the album store
        removeRename(oldImagePath);
    }
}
