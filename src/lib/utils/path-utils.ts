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
