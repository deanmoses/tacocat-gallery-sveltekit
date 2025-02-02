import { toast } from '@zerodevx/svelte-toast';
import { isValidAlbumPath } from '$lib/utils/galleryPathUtils';
import { createUrl } from '$lib/utils/config';

/**
 * Create specified album
 */
export async function createAlbum(albumPath: string) {
    if (!isValidAlbumPath(albumPath)) throw new Error(`Invalid album path [${albumPath}]`);
    const response = await fetch(createUrl(albumPath), {
        method: 'PUT',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    });
    if (!response.ok) {
        const msg = (await response.json()).errorMessage || response.statusText;
        toast.push(`Error creating: ${msg}`);
        throw new Error(`Error creating: ${msg}`);
    }
    console.log(`Album [${albumPath}] created`);
    toast.push(`Album [${albumPath}] created`);
}
