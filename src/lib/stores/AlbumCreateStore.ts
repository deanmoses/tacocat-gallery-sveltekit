/**
 * Svelte store of album create state.
 * This store will be empty unless there's an album create in progress.
 */

import { writable, type Readable, derived } from 'svelte/store';
import { enableMapSet } from 'immer';
import type { AlbumCreateEntry } from '$lib/models/album';

enableMapSet();

/** Key is the album path */
export type AlbumCreateStore = Map<string, AlbumCreateEntry>;
const initialState: AlbumCreateStore = new Map();
export const createStore = writable<AlbumCreateStore>(initialState);

/**
 * Get the create state of the specified album.
 * Will be undefined if the album isn't being created.
 */
export function getAlbumCreateEntry(albumPath: string): Readable<AlbumCreateEntry | undefined> {
    // Derive a read-only Svelte store over the create
    return derived(createStore, ($store) => $store.get(albumPath));
}
