import { produce } from 'immer';
import { toast } from '@zerodevx/svelte-toast';
import { isValidImagePath } from '$lib/utils/galleryPathUtils';
import { deleteUrl } from '$lib/utils/config';
import { type ImageDeleteStore, deleteStore } from '../ImageDeleteStore';
import { DeleteState, type DeleteEntry } from '$lib/models/album';

/**
 * Delete image
 * @param imagePath path to image
 */
export async function deleteImage(imagePath: string) {
    if (!isValidImagePath(imagePath)) throw new Error(`Invalid image path [${imagePath}]`);
    addDeleteEntry(imagePath);
    const response = await fetch(deleteUrl(imagePath), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });
    removeDeleteEntry(imagePath);
    if (!response.ok) {
        const msg = (await response.json()).errorMessage || response.statusText;
        toast.push(`Error creating: ${msg}`);
        throw new Error(`Error creating: ${msg}`);
    }
    console.log(`Image [${imagePath}] deleted`);
}

///////////////////////////////////////////////////////////////////////////////
// Svelte store mutators
///////////////////////////////////////////////////////////////////////////////

function addDeleteEntry(imagePath: string): void {
    const deleteEntry: DeleteEntry = {
        status: DeleteState.IN_PROGRESS,
    };
    deleteStore.update((oldState: ImageDeleteStore) =>
        produce(oldState, (draftState: ImageDeleteStore) => {
            draftState.set(imagePath, deleteEntry);
            return draftState;
        }),
    );
}

function removeDeleteEntry(imagePath: string): void {
    deleteStore.update((oldState: ImageDeleteStore) =>
        produce(oldState, (draftState: ImageDeleteStore) => {
            draftState.delete(imagePath);
            return draftState;
        }),
    );
}
