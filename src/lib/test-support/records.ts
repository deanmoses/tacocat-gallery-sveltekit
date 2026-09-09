/**
 * Fixtures for the records the server sends.
 *
 * These live outside any one spec because more than one spec needs them, and
 * because building them in one place is what makes them complete: a new
 * required field on the server types breaks this file at compile time rather
 * than leaving a dozen partial literals asserting against a shape the server
 * never sends.
 *
 * A builder takes only the fields a test is about. What varies between rows is
 * what the test is saying; everything else comes from the constants here.
 */
import toAlbum from '$lib/models/impl/AlbumCreator';
import type { Album } from '$lib/models/GalleryItemInterfaces';
import type { AlbumGalleryItem, ImageRecord, MediaRecord, VideoRecord } from '$lib/models/impl/server';

/** The album every fixture sits in, unless a spec is about paths themselves */
const ROOT_ALBUM_PATH = '/';
const YEAR_ALBUM_PATH = '/2001/';
const DAY_ALBUM_PATH = '/2001/12-31/';

export function mediaPath(fileName: string): string {
    return `${DAY_ALBUM_PATH}${fileName}`;
}

const BASE_MEDIA = {
    path: mediaPath('item.jpg'),
    parentPath: DAY_ALBUM_PATH,
    itemName: 'item.jpg',
    updatedOn: '2001-12-31T00:00:00.000Z',
    versionId: 'version-1',
    dimensions: { width: 4032, height: 3024 },
};

const BASE_ALBUM: AlbumGalleryItem = {
    itemType: 'album',
    path: YEAR_ALBUM_PATH,
    parentPath: ROOT_ALBUM_PATH,
    itemName: '2001',
    updatedOn: '2001-12-31T00:00:00.000Z',
};

/**
 * itemType is required rather than defaulted, because both sides of the
 * server's migration are in the wild and a fixture has to say which one it is.
 */
export function imageRecord(fields: Partial<ImageRecord> & Pick<ImageRecord, 'itemType'>): ImageRecord {
    return { ...BASE_MEDIA, ...fields };
}

export function videoRecord(fields: Partial<VideoRecord> & Pick<VideoRecord, 'itemType'>): VideoRecord {
    return { ...BASE_MEDIA, mediaType: 'video', id: 'video-1', duration: 12, ...fields };
}

export function albumRecord(fields: Partial<AlbumGalleryItem> = {}): AlbumGalleryItem {
    return { ...BASE_ALBUM, ...fields };
}

/** Built through the app's own factory, so specs get the album a caller is handed */
export function dayAlbum(children: MediaRecord[]): Album {
    return toAlbum(albumRecord({ path: DAY_ALBUM_PATH, parentPath: YEAR_ALBUM_PATH, itemName: '12-31', children }));
}
