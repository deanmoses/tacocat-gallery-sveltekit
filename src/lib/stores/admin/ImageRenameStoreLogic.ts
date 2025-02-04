import { albumStore } from '../AlbumStore.svelte';
import { getNameFromPath, getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
import { renameImageUrl } from '$lib/utils/config';
import { imageRenameStore } from '../ImageRenameStore.svelte';

/**
 * Rename specified image
 */
export async function renameImage(oldImagePath: string, newImagePath: string) {
    if (!isValidImagePath(oldImagePath)) throw new Error(`Invalid image path [${oldImagePath}]`);
    if (!isValidImagePath(newImagePath)) throw new Error(`Invalid image path [${newImagePath}]`);
    const albumPath = getParentFromPath(newImagePath);
    const album = albumStore.albums.get(albumPath)?.album;
    if (!album) throw new Error(`Album [${albumPath}] not loaded`);
    const newName = getNameFromPath(newImagePath);
    console.log(`Renaming image [${oldImagePath}] to [${newName}]...`);
    try {
        imageRenameStore.addRenameEntry(oldImagePath, newImagePath);
        const response = await fetch(renameImageUrl(oldImagePath), {
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
        await albumStore.fetchFromServer(albumPath); // this will update the album store
    } finally {
        imageRenameStore.removeRenameEntry(oldImagePath);
    }
}
