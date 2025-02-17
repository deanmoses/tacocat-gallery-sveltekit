import type {
    DeleteEntry,
    CropEntry,
    RenameEntry,
    UploadEntry,
    AlbumEntry,
    ReloadStatus,
    CreateEntry,
} from '$lib/models/album';
import { SvelteMap } from 'svelte/reactivity';

/**
 * The state of all albums and images
 */
class AlbumState {
    editMode = $state(false);
    albums = new SvelteMap<string, AlbumEntry>();
    albumUpdates = new SvelteMap<string, ReloadStatus>();
    albumCreates = new SvelteMap<string, CreateEntry>();
    albumRenames = new SvelteMap<string, RenameEntry>();
    albumDeletes = new SvelteMap<string, DeleteEntry>();
    imageRenames = new SvelteMap<string, RenameEntry>();
    imageDeletes = new SvelteMap<string, DeleteEntry>();
    crops = new SvelteMap<string, CropEntry>();
    uploads: UploadEntry[] = [];
}
export const albumState = new AlbumState();

//
// convenience functions
//

export function getUploadsForAlbum(albumPath: string): UploadEntry[] {
    return albumState.uploads.filter((upload) => upload.imagePath.startsWith(albumPath));
}

export function getUpload(imagePath: string): UploadEntry | undefined {
    return albumState.uploads.find((upload) => upload.imagePath === imagePath);
}
