import { AlbumType } from '$lib/models/album';
import { isValidDayAlbumPath, isValidMediaPath, isValidYearAlbumPath } from './galleryPathUtils';

/**
 * Return the type of album.
 * @param path path of an album
 * @throws Error if it's not a valid album path
 */
export function getAlbumType(path: string): AlbumType {
    if (path === '/') return AlbumType.ROOT;
    else if (isValidDayAlbumPath(path)) return AlbumType.DAY;
    else if (isValidYearAlbumPath(path)) return AlbumType.YEAR;
    else if (isValidMediaPath(path)) throw Error(`Media path, not album path [${path}]`);
    else throw Error(`Invalid album path [${path}]`);
}
