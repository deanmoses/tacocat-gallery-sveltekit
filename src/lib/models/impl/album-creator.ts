import { AlbumType } from '$lib/models/album';
import { getAlbumType } from '$lib/utils/path-utils';
import { DayAlbumImpl } from './DayAlbumImpl';
import type { Album } from './GalleryItemInterfaces';
import { RootAlbumImpl } from './RootAlbumImpl';
import { YearAlbumImpl } from './YearAlbumImpl';

/**
 * Create an Album or a subclass of Album from the specified object
 * @param json object created from JSON coming from server or stored in idb
 */
export default function toAlbum(json: any): Album {
    if (!json) throw new Error('No JSON object received');
    if (typeof json !== 'object') throw new Error(`JSON is not an object: [${json}]`);
    const path = json?.path;
    if (!path) throw new Error(`JSON has no path`);
    const type = getAlbumType(path);
    switch (type) {
        case AlbumType.ROOT:
            return new RootAlbumImpl(json);
        case AlbumType.YEAR:
            return new YearAlbumImpl(json);
        case AlbumType.DAY:
            return new DayAlbumImpl(json);
        default:
            throw new Error(`Unexpected album type [${type}]`);
    }
}
