import { type Album, AlbumType } from '$lib/models/album';
import RootAlbum from '$lib/models/impl/album-root';
import YearAlbum from '$lib/models/impl/album-year';
import DayAlbum from '$lib/models/impl/album-day';
import { getAlbumType } from '$lib/utils/path-utils';

/**
 * Create an Album or a subclass of Album from the specified object
 * @param json object created from JSON coming from server or stored in idb
 */
export default function createAlbumFromObject(json: any): Album {
    if (!json) throw new Error('No JSON object received');
    if (typeof json !== 'object') throw new Error(`JSON is not an object: [${json}]`);
    const path = json?.path;
    if (!path) throw new Error(`JSON has no path`);
    let album: Album;
    const type = getAlbumType(path);
    switch (type) {
        case AlbumType.ROOT:
            album = new RootAlbum(path);
            break;
        case AlbumType.YEAR:
            album = new YearAlbum(path);
            break;
        case AlbumType.DAY:
            album = new DayAlbum(path);
            break;
        default:
            throw new Error(`Unexpected album type [${type}]`);
    }
    return Object.assign(album, json);
}
