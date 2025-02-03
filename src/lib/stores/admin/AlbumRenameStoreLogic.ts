import { get } from 'svelte/store';
import { albumStore } from '../AlbumStore';
import { getNameFromPath, getParentFromPath, isValidDayAlbumPath } from '$lib/utils/galleryPathUtils';
import { renameAlbumUrl } from '$lib/utils/config';
import { albumRenameStore } from '../AlbumRenameStore.svelte';

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
        albumRenameStore.add(oldAlbumPath, newAlbumPath);
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
        albumRenameStore.remove(oldAlbumPath);
    }
}
