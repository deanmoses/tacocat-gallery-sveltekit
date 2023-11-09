import { type Album, AlbumType } from '$lib/models/album';
import RootAlbum from '$lib/models/impl/album-root';
import YearAlbum from '$lib/models/impl/album-year';
import DayAlbum from '$lib/models/impl/album-day';
import { getAlbumType } from '$lib/utils/path-utils';

/**
 * Create an Album or a subclass of Album
 * @param json JSON or any Object
 */
export default function createAlbumFromObject(json: any): Album {
    const album: Album = instantiateAlbum(json);
    return Object.assign(album, json);
}

function instantiateAlbum(json: any): Album {
    if (!json.parentPath) throw new Error(`JSON doesn't contain parentPath`);
    if (!json.itemName) throw new Error(`JSON doesn't contain itemName`);
    const path = json.parentPath + json.itemName + '/';
    const type = getAlbumType(path);
    switch (type) {
        case AlbumType.ROOT:
            return new RootAlbum(path);
        case AlbumType.YEAR:
            return new YearAlbum(path);
        case AlbumType.DAY:
            return new DayAlbum(path);
        default:
            throw new Error(`Unexpected album type [${type}]`);
    }
}
