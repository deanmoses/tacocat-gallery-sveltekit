import { get } from 'svelte/store';
import { produce } from 'immer';
import { toast } from '@zerodevx/svelte-toast';
import { albumStore } from '../AlbumStore';
import { getNameFromPath, getParentFromPath, isValidDayAlbumPath } from '$lib/utils/galleryPathUtils';
import { renameAlbumUrl } from '$lib/utils/config';
import { type AlbumRenameStore, renameStore } from '../AlbumRenameStore';
import { RenameState, type RenameEntry } from '$lib/models/album';

/**
 * Rename specified album
 */
export async function renameDayAlbum(oldAlbumPath: string, newAlbumPath: string) {
    if (!isValidDayAlbumPath(oldAlbumPath)) throw new Error(`Invalid old album path [${oldAlbumPath}]`);
    if (!isValidDayAlbumPath(newAlbumPath)) throw new Error(`Invalid new album path [${newAlbumPath}]`);
    const album = get(albumStore.get(oldAlbumPath))?.album;
    if (!album) throw new Error(`Album [${oldAlbumPath}] not loaded`);

    addRenameEntry(oldAlbumPath, newAlbumPath);
    console.log(`Attempting to rename album [${oldAlbumPath}] to [${newAlbumPath}]`);
    const newName = getNameFromPath(newAlbumPath);
    const url = renameAlbumUrl(oldAlbumPath);
    const requestConfig: RequestInit = {
        method: 'POST',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName }),
    };
    const response = await fetch(url, requestConfig);

    if (!response.ok) {
        removeRenameEntry(oldAlbumPath);
        const msg = (await response.json()).errorMessage || response.statusText;
        toast.push(`Error renaming album [${oldAlbumPath}]: ${msg}`);
    } else {
        // Rename was successful

        // Fetch parent album to get renamed album added to it
        console.log(`Fetching parent album`);
        const parentAlbumPath = getParentFromPath(oldAlbumPath);
        // Do NOT async await because we want the UI to move to
        // the new album now
        albumStore.fetchFromServerAsync(parentAlbumPath);
        console.log(`Fetched parent album`);
        removeRenameEntry(oldAlbumPath);

        // Remove old album from album store, but do NOT async await
        // because we want the UI to move away from the old album first
        console.log(`Removing old album from client`);
        albumStore.removeFromMemoryAndDisk(oldAlbumPath);
        console.log(`Removed old album from client`);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Svelte store mutators
///////////////////////////////////////////////////////////////////////////////

function addRenameEntry(oldPath: string, newPath: string): void {
    const rename: RenameEntry = {
        oldPath: oldPath,
        newPath: newPath,
        status: RenameState.IN_PROGRESS,
    };
    renameStore.update((oldValue: AlbumRenameStore) =>
        produce(oldValue, (draftState: AlbumRenameStore) => {
            draftState.set(oldPath, rename);
            return draftState;
        }),
    );
}

function removeRenameEntry(oldPath: string): void {
    renameStore.update((oldValue: AlbumRenameStore) =>
        produce(oldValue, (draftState: AlbumRenameStore) => {
            draftState.delete(oldPath);
            return draftState;
        }),
    );
}
