import type { Album, Media } from '../GalleryItemInterfaces';
import { ImageImpl } from './ImageImpl';
import { VideoImpl } from './VideoImpl';
import type { MediaRecord } from './server';
import { isImageRecord, isVideoRecord } from './server';

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
