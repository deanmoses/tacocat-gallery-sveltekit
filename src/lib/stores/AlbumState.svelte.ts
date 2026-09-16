import type {
    DeleteEntry,
    CropEntry,
    RenameEntry,
    UploadEntry,
    AlbumEntry,
    ReloadStatus,
    CreateEntry,
} from '$lib/models/album';
import type { Album } from '$lib/models/GalleryItemInterfaces';
import { getParentFromPath } from '$lib/utils/galleryPathUtils';
import { SvelteMap } from 'svelte/reactivity';

/**
 * The state of all albums and media
 */
class AlbumState {
    editMode = $state(false);
    albums = new SvelteMap<string, AlbumEntry>();
    albumUpdates = new SvelteMap<string, ReloadStatus>();
    albumCreates = new SvelteMap<string, CreateEntry>();
    albumRenames = new SvelteMap<string, RenameEntry>();
    albumDeletes = new SvelteMap<string, DeleteEntry>();
    mediaRenames = new SvelteMap<string, RenameEntry>();
    mediaDeletes = new SvelteMap<string, DeleteEntry>();
    crops = new SvelteMap<string, CropEntry>();
    uploads: UploadEntry[] = $state([]);
    /** When this session last changed each album, so a re-read soon after can ask past the edge cache */
    albumChangedAt = new Map<string, number>();
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

/** The album's parent, if it has loaded. The root has none. */
export function getParentAlbum(albumPath: string): Album | undefined {
    return albumState.albums.get(getParentFromPath(albumPath))?.album;
}
