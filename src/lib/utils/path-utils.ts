import { AlbumType } from '$lib/models/album';
import { isValidDayAlbumPath, isValidImagePath, isValidYearAlbumPath } from './galleryPathUtils';

/**
 * Return the type of album.  If it's an image, throws exception
 * @param path path of an album
 */
export function getAlbumType(path: string): AlbumType {
    if (path === '/') return AlbumType.ROOT;
    else if (isValidDayAlbumPath(path)) return AlbumType.DAY;
    else if (isValidYearAlbumPath(path)) return AlbumType.YEAR;
    else if (isValidImagePath(path)) throw Error(`Image not album path [${path}]`);
    else throw Error(`Invalid album path [${path}]`);
}

/**
 * @param path path not in edit mode, like /2001/12-31
 * @returns the edit version of the URL, like /edit/2001/12-31
 */
export function editUrl(path: string | undefined): string | undefined {
    return path ? `/edit${path}` : undefined;
}

/**
 * Generate the non-Edit Mode URL from the Edit Mode URL
 *
 * @param path path in edit mode, like /edit/2001/12-31
 * @returns the non-edit version of the URL, like /2001/12-31
 */
export function unEditUrl(path: string | undefined): string | undefined {
    return path?.replace(/^\/edit/, '') ?? undefined;
}
