/**
 * Svelte store of album delete state.
 * This store will be empty unless there's an album delete in progress.
 */

import { writable, type Readable, derived } from 'svelte/store';
import { enableMapSet } from 'immer';
import type { DeleteEntry } from '$lib/models/album';

enableMapSet();

/** Key is the album path */
export type AlbumDeleteStore = Map<string, DeleteEntry>;
const initialState: AlbumDeleteStore = new Map();
export const deleteStore = writable<AlbumDeleteStore>(initialState);

/**
 * Get the delete state of the specified album.
 * Will be undefined if the album isn't being deleted.
 */
export function getAlbumDeleteEntry(albumPath: string): Readable<DeleteEntry | undefined> {
    // Derive a read-only Svelte store over the delete
    return derived(deleteStore, ($store) => $store.get(albumPath));
}
