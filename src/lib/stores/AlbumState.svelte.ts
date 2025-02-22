import type { AlbumEntry, ReloadStatus, ImageEntry } from '$lib/models/album';
import { SvelteMap } from 'svelte/reactivity';

/**
 * The state of all albums and images
 */
class AlbumState {
    editMode = $state(false);
    albums = $state(new SvelteMap<string, AlbumEntry>());
    albumReloads = new SvelteMap<string, ReloadStatus>();
    images = new SvelteMap<string, ImageEntry>();
}
export const albumState = new AlbumState();

//
// convenience functions
//

export function getUploadsForAlbum(albumPath: string): ImageEntry[] {
    const uploads = [];
    for (const [imagePath, imageEntry] of albumState.images) {
        if (imagePath.startsWith(albumPath)) {
            uploads.push(imageEntry);
        }
    }
    return uploads;
}
