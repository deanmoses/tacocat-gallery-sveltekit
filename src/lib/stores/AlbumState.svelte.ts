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
 * The state of all albums and media
 */
class AlbumState {
    editMode = $state(false);
    albums = $state(new SvelteMap<string, AlbumEntry>());
    albumUpdates = new SvelteMap<string, ReloadStatus>();
    albumCreates = new SvelteMap<string, CreateEntry>();
    albumRenames = new SvelteMap<string, RenameEntry>();
    albumDeletes = $state(new SvelteMap<string, DeleteEntry>());
    mediaRenames = new SvelteMap<string, RenameEntry>();
    mediaDeletes = new SvelteMap<string, DeleteEntry>();
    crops = new SvelteMap<string, CropEntry>();
    uploads: UploadEntry[] = $state([]);
}
export const albumState = new AlbumState();

//
// convenience functions
//

export function getUploadsForAlbum(albumPath: string): UploadEntry[] {
    return albumState.uploads.filter((upload) => upload.mediaPath.startsWith(albumPath));
}

export function getUpload(mediaPath: string): UploadEntry | undefined {
    return albumState.uploads.find((upload) => upload.mediaPath === mediaPath);
}
