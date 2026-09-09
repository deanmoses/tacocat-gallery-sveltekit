import { describe, it, expect } from 'vitest';
import { isAlbumRecord, isMediaRecord, isImageRecord, isVideoRecord } from './server';
import type { AlbumRecord, GalleryRecord, ImageRecord, VideoRecord } from './server';

/**
 * The four guards partition every record the server can send, across a
 * migration that changed how media identifies itself: pre-migration records
 * carry itemType 'image' and mark videos with mediaType, post-migration ones
 * carry itemType 'media' and always state mediaType.
 *
 * Both formats are in the wild, so the guards are asserted as a full truth
 * table rather than as a handful of positive cases. A guard that stops
 * excluding something is as much a bug as one that stops including it, and
 * only the table catches the first kind.
 */
type GuardCase = {
    /** The kind of record, in the terms the migration uses */
    description: string;
    record: GalleryRecord;
    isAlbum: boolean;
    isMedia: boolean;
    isImage: boolean;
    isVideo: boolean;
};

/**
 * Records are built complete rather than cast from a partial literal, so that
 * a new required field on the server types breaks this file at compile time
 * instead of leaving it asserting against a shape the server never sends.
 */
const MEDIA_FIELDS = {
    path: '/2024/01-01/item',
    parentPath: '/2024/01-01/',
    itemName: 'item',
    updatedOn: '2024-01-01T00:00:00.000Z',
    versionId: 'version-1',
    dimensions: { width: 4032, height: 3024 },
};

function albumRecord(): AlbumRecord {
    return {
        itemType: 'album',
        path: '/2024/',
        parentPath: '/',
        itemName: '2024',
        updatedOn: '2024-01-01T00:00:00.000Z',
    };
}

function imageRecord(fields: Pick<ImageRecord, 'itemType' | 'mediaType'>): ImageRecord {
    return { ...MEDIA_FIELDS, ...fields };
}

function videoRecord(fields: Pick<VideoRecord, 'itemType'>): VideoRecord {
    return { ...MEDIA_FIELDS, mediaType: 'video', id: 'video-1', duration: 12, ...fields };
}

const CASES: GuardCase[] = [
    {
        description: 'album',
        record: albumRecord(),
        isAlbum: true,
        isMedia: false,
        isImage: false,
        isVideo: false,
    },
    {
        description: 'pre-migration image (itemType image, no mediaType)',
        record: imageRecord({ itemType: 'image' }),
        isAlbum: false,
        isMedia: true,
        isImage: true,
        isVideo: false,
    },
    {
        description: 'pre-migration video (itemType image, mediaType video)',
        record: videoRecord({ itemType: 'image' }),
        isAlbum: false,
        isMedia: true,
        isImage: false,
        isVideo: true,
    },
    {
        description: 'post-migration image (itemType media, mediaType image)',
        record: imageRecord({ itemType: 'media', mediaType: 'image' }),
        isAlbum: false,
        isMedia: true,
        isImage: true,
        isVideo: false,
    },
    {
        description: 'post-migration video (itemType media, mediaType video)',
        record: videoRecord({ itemType: 'media' }),
        isAlbum: false,
        isMedia: true,
        isImage: false,
        isVideo: true,
    },
    {
        // ImageRecord leaves mediaType optional, so this shape is legal in both
        // formats and has to resolve somewhere: absent mediaType means image
        description: 'post-migration record with no mediaType',
        record: imageRecord({ itemType: 'media' }),
        isAlbum: false,
        isMedia: true,
        isImage: true,
        isVideo: false,
    },
];

describe(isAlbumRecord, () => {
    it.each(CASES)('$description: $isAlbum', ({ record, isAlbum }) => {
        expect(isAlbumRecord(record)).toBe(isAlbum);
    });
});

describe(isMediaRecord, () => {
    it.each(CASES)('$description: $isMedia', ({ record, isMedia }) => {
        expect(isMediaRecord(record)).toBe(isMedia);
    });
});

describe(isImageRecord, () => {
    it.each(CASES)('$description: $isImage', ({ record, isImage }) => {
        expect(isImageRecord(record)).toBe(isImage);
    });
});

describe(isVideoRecord, () => {
    it.each(CASES)('$description: $isVideo', ({ record, isVideo }) => {
        expect(isVideoRecord(record)).toBe(isVideo);
    });
});
