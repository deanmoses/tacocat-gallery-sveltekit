/**
 * Svelte stores of photos being uploaded
 */

import { produce } from 'immer';
import { writable, derived, type Readable } from 'svelte/store';

export type Upload = {
    file: File;
    imagePath: string;
    status: UploadState;
};
type UploadState = 'upload_not_started' | 'uploading' | 'processing';

const uploadStore = writable<Upload[]>([]);

export function getUploads(): Readable<Upload[]> {
    // Derive a read-only Svelte store over the uploads
    return derived(uploadStore, ($store) => $store);
}

export function addUpload(file: File, imagePath: string): void {
    const upload: Upload = {
        file,
        imagePath,
        status: 'upload_not_started',
    };
    uploadStore.update((oldValue: Upload[]) =>
        produce(oldValue, (draftState: Upload[]) => {
            draftState.push(upload);
            return draftState;
        }),
    );
}

export function updateUploadState(imagePath: string, status: UploadState): void {
    uploadStore.update((oldValue: Upload[]) =>
        produce(oldValue, (draftState: Upload[]) => {
            const upload = draftState.find((upload) => upload.imagePath === imagePath);
            if (upload) upload.status = status;
            return draftState;
        }),
    );
}

export function removeUpload(imagePath: string): void {
    uploadStore.update((oldValue: Upload[]) =>
        produce(oldValue, (draftState: Upload[]) => draftState.filter((upload) => upload.imagePath !== imagePath)),
    );
}
