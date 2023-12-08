import { get } from 'svelte/store';
import { produce } from 'immer';
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
    const newName = getNameFromPath(newAlbumPath);
    console.log(`Renaming album [${oldAlbumPath}] to [${newName}]...`);
    try {
        addRenameEntry(oldAlbumPath, newAlbumPath);
        const response = await fetch(renameAlbumUrl(oldAlbumPath), {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newName }),
        });
        if (!response.ok) {
            const msg = (await response.json()).errorMessage || response.statusText;
            throw msg;
        }
        // Fetch parent album to get renamed album added to it
        // Do NOT async await because we want the UI to move to
        // the new album now
        const parentAlbumPath = getParentFromPath(oldAlbumPath);
        albumStore.fetchFromServerAsync(parentAlbumPath);
        // Remove old album from album store, but do NOT async await
        // because we want the UI to move away from the old album first
        albumStore.removeFromMemoryAndDisk(oldAlbumPath);
    } finally {
        removeRenameEntry(oldAlbumPath);
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
