/**
 * Svelte store of album rename state.
 * This store will be empty unless there's an album rename in progress.
 */

import { writable, type Readable, derived } from 'svelte/store';
import { enableMapSet } from 'immer';
import type { RenameEntry } from '$lib/models/album';

enableMapSet();

/** Key is the album path */
export type AlbumRenameStore = Map<string, RenameEntry>;
const initialState: AlbumRenameStore = new Map();
export const renameStore = writable<AlbumRenameStore>(initialState);

/**
 * Get the rename state of the specified album.
 * Will be undefined if the album isn't being renamed.
 */
export function getAlbumRenameEntry(oldPath: string): Readable<RenameEntry | undefined> {
    // Derive a read-only Svelte store over the rename
    return derived(renameStore, ($store) => $store.get(oldPath));
}
