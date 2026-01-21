import type { Album, Media, Thumbable } from '../GalleryItemInterfaces';
import { ImageImpl } from './ImageImpl';
import { VideoImpl } from './VideoImpl';
import toAlbum from './AlbumCreator';
import type { GalleryRecord, MediaRecord } from './server';
import { isAlbumRecord, isImageRecord, isMediaRecord, isVideoRecord } from './server';

/**
 * Instantiate a Thumbable (Album or Media) from the specified record
 * @param record Gallery record from server or stored in idb
 * @param album Parent album (required for media items, ignored for albums)
 */
export function toThumbable(record: GalleryRecord, album: Album): Thumbable {
    if (isAlbumRecord(record)) {
        return toAlbum(record);
    }
    if (isMediaRecord(record)) {
        return toMedia(record, album);
    }
    throw new Error(`Unknown gallery item type: ${JSON.stringify(record)}`);
}

/**
 * Instantiate a Media (Image or Video) from the specified record
 * @param record Media record from server or stored in idb
 * @param album Parent album containing this media
 */
export function toMedia(record: MediaRecord, album: Album): Media {
    if (isVideoRecord(record)) {
        return new VideoImpl(record, album);
    }
    if (isImageRecord(record)) {
        return new ImageImpl(record, album);
    }
    throw new Error(`Unknown media type: ${JSON.stringify(record)}`);
}
