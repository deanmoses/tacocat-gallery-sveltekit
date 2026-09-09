import { describe, it, expect } from 'vitest';
import { isAlbumRecord, isMediaRecord, isImageRecord, isVideoRecord } from './server';
import type { GalleryRecord } from './server';
import { albumRecord, imageRecord, videoRecord } from '$lib/test-support/records';

/**
 * A migration changed how media identifies itself: pre-migration records carry
 * itemType 'image' and mark videos with mediaType, post-migration ones carry
 * itemType 'media' and always state mediaType. Both are still in the wild,
 * which is why the guards read the way they do.
 *
 * isVideoRecord's leading isMediaRecord() check is the one thing the table
 * cannot reach: a record with mediaType 'video' and a non-media itemType is
 * not constructible through the types.
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
