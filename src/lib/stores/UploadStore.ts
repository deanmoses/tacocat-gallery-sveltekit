/**
 * Svelte store of photos being uploaded.
 * This store will be empty unless there's an image upload in progress.
 */

import { writable, derived, type Readable } from 'svelte/store';
import { UploadState, type UploadEntry } from '$lib/models/album';

/** Whether to load the store with mock uploads */
export const mock = false;
export type UploadStore = UploadEntry[];
const initialState: UploadStore = !mock
    ? []
    : [
          {
              imagePath: '/2021/11-27/image1.jpg',
              status: UploadState.UPLOAD_NOT_STARTED,
              file: new File([], 'image1.jpg'),
          },
          {
              imagePath: '/2021/11-27/image2.jpg',
              status: UploadState.UPLOAD_NOT_STARTED,
              file: new File([], 'image2.jpg'),
          },
          {
              imagePath: '/2021/11-27/image3.jpg',
              status: UploadState.UPLOAD_NOT_STARTED,
              file: new File([], 'image3.jpg'),
          },
      ];
export const uploadStore = writable<UploadStore>(initialState);

export function getUploads(albumPath: string): Readable<UploadStore> {
    // Derive a read-only Svelte store over the uploads for a particular album
    return derived(uploadStore, ($store) => {
        return $store.filter((upload) => upload.imagePath.startsWith(albumPath));
    });
}

export function getUpload(imagePath: string): Readable<UploadEntry | undefined> {
    // Derive a read-only Svelte store over the uploads
    return derived(uploadStore, ($store) => $store.find((upload) => upload.imagePath === imagePath));
}
