import { AlbumUpdateStatus } from '$lib/models/album';
import { albumStore } from '$lib/stores/AlbumStore';
import { setThumbnailUrl } from '$lib/utils/config';
import { getParentFromPath } from '$lib/utils/galleryPathUtils';
import { toast } from '@zerodevx/svelte-toast';

/**
 * Set specified thumbnail as specified album's thumbnail
 *
 * @param albumPath path of album on which to set the thumbnail
 * @param imagePath path of image, like '/2001/12-31/image.jpg'
 */
export async function setAlbumThumbnail(albumPath: string, imagePath: string): Promise<void> {
    console.log(`Setting thumbnail of album [${albumPath}] to [${imagePath}]`);

    // Update store state to "Saving..."
    albumStore.setUpdateStatus(albumPath, AlbumUpdateStatus.UPDATING);
    try {
        // Make the save request
        const response = await fetch(setThumbnailUrl(albumPath), {
            method: 'PATCH',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imagePath }),
        });

        // Check for errors
        if (!response.ok) {
            const msg = (await response.json()).errorMessage || response.statusText;
            toast.push(`Error saving thumbnail: ${msg}`);
            throw new Error(`Error saving thumbnail: ${msg}`);
        }
        console.log(`Set thumbnail of album [${albumPath}] to [${imagePath}]`);
        await albumStore.fetchFromServerAsync(albumPath); // force reload from server
        await albumStore.fetchFromServerAsync(getParentFromPath(albumPath)); // force reload from server
    } finally {
        // Reset store state
        albumStore.setUpdateStatus(albumPath, AlbumUpdateStatus.NOT_UPDATING);
    }
}
