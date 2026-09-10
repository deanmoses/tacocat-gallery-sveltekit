import { albumState } from '$lib/stores/AlbumState.svelte';
import { AlbumLoadStatus, type AlbumEntry } from '$lib/models/album';
import toAlbum from '$lib/models/impl/AlbumCreator';
import type { AlbumGalleryItem } from '$lib/models/impl/server';
import type { Album } from '$lib/models/GalleryItemInterfaces';

/**
 * Every store writes to the one AlbumState singleton, and specs run in a
 * shuffled order, so an album left behind by one spec changes what an unrelated
 * one sees. Nine collections is more than a spec should have to remember.
 */
export function resetAlbumState(): void {
    albumState.editMode = false;
    albumState.uploads = [];
    albumState.albums.clear();
    albumState.albumUpdates.clear();
    albumState.albumCreates.clear();
    albumState.albumRenames.clear();
    albumState.albumDeletes.clear();
    albumState.mediaRenames.clear();
    albumState.mediaDeletes.clear();
    albumState.crops.clear();
}

/**
 * Puts an album into memory in the state the app reaches after a successful
 * load. The album is stated as present in the return type, so a spec reaching
 * for it does not have to narrow what it just built.
 */
export function seedLoadedAlbum(record: AlbumGalleryItem): AlbumEntry & { album: Album } {
    const entry = { loadStatus: AlbumLoadStatus.LOADED, album: toAlbum(record) };
    albumState.albums.set(record.path, entry);
    return entry;
}
