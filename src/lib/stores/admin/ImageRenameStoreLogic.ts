import { get } from 'svelte/store';
import { produce } from 'immer';
import { toast } from '@zerodevx/svelte-toast';
import { albumStore } from '../AlbumStore';
import { getNameFromPath, getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
import { renameImageUrl } from '$lib/utils/config';
import { type ImageRenameStore, renameStore } from '../ImageRenameStore';
import { RenameState, type RenameEntry } from '$lib/models/album';

/**
 * Rename specified image
 */
export async function renameImage(oldImagePath: string, newImagePath: string) {
    if (!isValidImagePath(oldImagePath)) throw new Error(`Invalid image path [${oldImagePath}]`);
    if (!isValidImagePath(newImagePath)) throw new Error(`Invalid image path [${newImagePath}]`);
    const albumPath = getParentFromPath(newImagePath);
    const album = get(albumStore.get(albumPath))?.album;
    if (!album) throw new Error(`Album [${albumPath}] not loaded`);
    addRenameEntry(oldImagePath, newImagePath);
    console.log(`Attempting to rename image [${oldImagePath}] to [${newImagePath}]`);
    const newName = getNameFromPath(newImagePath);
    const url = renameImageUrl(oldImagePath);
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
        removeRenameEntry(oldImagePath);
        const msg = (await response.json()).errorMessage || response.statusText;
        toast.push(`Error renaming image [${oldImagePath}]: ${msg}`);
    } else {
        await albumStore.fetchFromServerAsync(albumPath); // this will update the album store
        removeRenameEntry(oldImagePath);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Svelte store mutators
///////////////////////////////////////////////////////////////////////////////

function addRenameEntry(oldPath: string, newPath: string): void {
    const rename: RenameEntry = {
        oldPath,
        newPath,
        status: RenameState.IN_PROGRESS,
    };
    renameStore.update((oldValue: ImageRenameStore) =>
        produce(oldValue, (draftState: ImageRenameStore) => {
            draftState.set(oldPath, rename);
            return draftState;
        }),
    );
}

function removeRenameEntry(oldPath: string): void {
    renameStore.update((oldValue: ImageRenameStore) =>
        produce(oldValue, (draftState: ImageRenameStore) => {
            draftState.delete(oldPath);
            return draftState;
        }),
    );
}
