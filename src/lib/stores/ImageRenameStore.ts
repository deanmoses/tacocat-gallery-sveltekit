/**
 * Svelte store of image rename state.
 * This store will be empty unless there's an image rename in progress.
 */

import { writable, type Readable, derived } from 'svelte/store';
import { enableMapSet } from 'immer';
import type { RenameEntry } from '$lib/models/album';

enableMapSet();

/** Key is the image path */
export type ImageRenameStore = Map<string, RenameEntry>;
const initialState: ImageRenameStore = new Map();
export const renameStore = writable<ImageRenameStore>(initialState);

/**
 * Get the rename state of the specified image.
 * Will be undefined if the image isn't being renamed.
 */
export function getImageRenameEntry(imagePath: string): Readable<RenameEntry | undefined> {
    // Derive a read-only Svelte store over the rename
    return derived(renameStore, ($store) => $store.get(imagePath));
}
