/**
 * Svelte store of image delete state.
 * This store will be empty unless there's an image delete in progress.
 */

import { writable, type Readable, derived } from 'svelte/store';
import { enableMapSet } from 'immer';
import type { DeleteEntry } from '$lib/models/album';

enableMapSet();

/** Key is the image path */
export type ImageDeleteStore = Map<string, DeleteEntry>;
const initialState: ImageDeleteStore = new Map();
export const deleteStore = writable<ImageDeleteStore>(initialState);

/**
 * Get the delete state of the specified image.
 * Will be undefined if the image isn't being deleted.
 */
export function getImageDeleteEntry(imagePath: string): Readable<DeleteEntry | undefined> {
    // Derive a read-only Svelte store over the delete
    return derived(deleteStore, ($store) => $store.get(imagePath));
}
