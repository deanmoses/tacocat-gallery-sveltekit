/**
 * Svelte store of image delete state.
 * This store will be empty unless there's an image delete in progress.
 */

import { isValidImagePath } from '$lib/utils/galleryPathUtils';
import { writable, type Readable, derived } from 'svelte/store';
import { produce, enableMapSet } from 'immer';
import { deleteUrl } from '$lib/utils/config';
import { toast } from '@zerodevx/svelte-toast';

enableMapSet();

/**
 * Key is the image path
 */
type ImageDeleteStore = Map<string, DeleteEntry>;

/**
 * An entry in the delete store
 * Represents a single image being deleted
 */
export type DeleteEntry = {
    status: DeleteState;
};

export enum DeleteState {
    IN_PROGRESS = 'In Progress',
}

const initialState: ImageDeleteStore = new Map();
const deleteStore = writable<ImageDeleteStore>(initialState);

/**
 * Get the delete state of the specified image.
 * Will be undefined if the image isn't being deleted.
 */
export function getImageDeleteEntry(imagePath: string): Readable<DeleteEntry | undefined> {
    // Derive a read-only Svelte store over the delete
    return derived(deleteStore, ($store) => $store.get(imagePath));
}

function addDeleteEntry(imagePath: string): void {
    const deleteEntry: DeleteEntry = {
        status: DeleteState.IN_PROGRESS,
    };
    deleteStore.update((oldState: ImageDeleteStore) =>
        produce(oldState, (draftState: ImageDeleteStore) => {
            draftState.set(imagePath, deleteEntry);
            return draftState;
        }),
    );
}

function removeDeleteEntry(imagePath: string): void {
    deleteStore.update((oldState: ImageDeleteStore) =>
        produce(oldState, (draftState: ImageDeleteStore) => {
            draftState.delete(imagePath);
            return draftState;
        }),
    );
}

//
// Above this is the Svelte store
// Below this is the album delete functionality,
// which relies on the data store but is separate.
// They're in the same file to encapsulate the system, so that I don't have
// to expose the mutator methods on the data store to the rest of the system
//

/**
 * Delete image
 * @param imagePath path to image
 */
export async function deleteImage(imagePath: string) {
    if (!isValidImagePath(imagePath)) throw new Error(`Invalid image path [${imagePath}]`);
    addDeleteEntry(imagePath);
    const response = await fetch(deleteUrl(imagePath), {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });
    removeDeleteEntry(imagePath);
    if (!response.ok) {
        const msg = (await response.json()).errorMessage || response.statusText;
        toast.push(`Error creating: ${msg}`);
        throw new Error(`Error creating: ${msg}`);
    }
    console.log(`Image [${imagePath}] deleted`);
}
