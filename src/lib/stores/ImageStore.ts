/**
 * Svelte store of image state.
 * This combines several Svelte stores into a single store.
 */

import type { Image } from '$lib/models/GalleryItemInterfaces';
import { derived, type Readable } from 'svelte/store';
import { getImageRenameStatus, type RenameEntry } from './ImageRenameStore';
import { getUpload, type UploadEntry } from './UploadStore';
import { albumStore, type AlbumEntry } from './AlbumStore';
import { getParentFromPath } from '$lib/utils/galleryPathUtils';

/**
 * An entry in the image store
 * Represents a single image
 */
export type ImageEntry = {
    albumEntry?: AlbumEntry;
    image?: Image;
    rename?: RenameEntry;
    upload?: UploadEntry;
};

export function getImage(imagePath: string): Readable<ImageEntry> {
    // Derive a read-only Svelte store over the image, collecting
    // state from various places
    const albumPath = getParentFromPath(imagePath);
    const refetchAlbum = false;
    const albumEntry = albumStore.get(albumPath, refetchAlbum);
    const rename = getImageRenameStatus(imagePath);
    const upload = getUpload(imagePath);
    return derived([albumEntry, rename, upload], ([$albumEntry, $rename, $upload]) => {
        return {
            albumEntry: $albumEntry,
            image: $albumEntry?.album?.getImage(imagePath),
            rename: $rename,
            upload: $upload,
        };
    });
}
