import type { Album, Thumbable } from '$lib/models/GalleryItemInterfaces';

/** The year album the latest album is looked for in */
export function currentYearAlbumPath(): string {
    return `/${new Date().getFullYear()}/`;
}

/**
 * The newest published album of a year. An admin's copy of the year lists
 * unpublished albums too; they are skipped so that both see the same one.
 */
export function latestAlbum(year: Album | undefined): Thumbable | undefined {
    return year?.albums.filter((album) => album.published).at(-1);
}
