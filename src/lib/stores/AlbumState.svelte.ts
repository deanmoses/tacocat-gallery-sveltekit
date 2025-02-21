import type { DeleteEntry, CropEntry, RenameEntry, UploadEntry, AlbumEntry, ReloadStatus } from '$lib/models/album';
import { SvelteMap } from 'svelte/reactivity';

/**
 * The state of all albums and images
 */
class AlbumState {
    editMode = $state(false);
    albums = $state(new SvelteMap<string, AlbumEntry>());
    albumReloads = new SvelteMap<string, ReloadStatus>();
    albumRenames = new SvelteMap<string, RenameEntry>();
    imageRenames = new SvelteMap<string, RenameEntry>();
    imageDeletes = new SvelteMap<string, DeleteEntry>();
    crops = new SvelteMap<string, CropEntry>();
    uploads: UploadEntry[] = $state([]);
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
