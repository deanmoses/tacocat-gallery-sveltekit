import { toast } from '@zerodevx/svelte-toast';
import { isValidImagePath } from '$lib/utils/galleryPathUtils';
import { deleteUrl } from '$lib/utils/config';
import { imageDeleteStore } from '../ImageDeleteStore.svelte';

/**
 * Delete specified image
 * @param imagePath path to image
 */
export async function deleteImage(imagePath: string) {
    if (!isValidImagePath(imagePath)) throw new Error(`Invalid image path [${imagePath}]`);
    imageDeleteStore.add(imagePath);
    const response = await fetch(deleteUrl(imagePath), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });
    imageDeleteStore.remove(imagePath);
    if (!response.ok) {
        const msg = (await response.json()).errorMessage || response.statusText;
        toast.push(`Error creating: ${msg}`);
        throw new Error(`Error creating: ${msg}`);
    }
    console.log(`Image [${imagePath}] deleted`);
}
