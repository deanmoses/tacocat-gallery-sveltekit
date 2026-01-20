import { describe, it, expect } from 'vitest';
import { isMediaRecord, isImageRecord, isVideoRecord } from './server';
import type { GalleryRecord } from './server';

describe('type guards', () => {
    // Old format (before migration)
    describe('old format (itemType: image)', () => {
        it('isMediaRecord returns true for old image', () => {
            const record = { itemType: 'image', path: '/2024/01-01/photo.jpg' } as GalleryRecord;
            expect(isMediaRecord(record)).toBe(true);
        });

        it('isImageRecord returns true for old image (no mediaType)', () => {
            const record = { itemType: 'image', path: '/2024/01-01/photo.jpg' } as GalleryRecord;
            expect(isImageRecord(record)).toBe(true);
        });

        it('isVideoRecord returns true for old video', () => {
            const record = { itemType: 'image', mediaType: 'video', path: '/2024/01-01/video.mp4' } as GalleryRecord;
            expect(isVideoRecord(record)).toBe(true);
        });

        it('isImageRecord returns false for old video', () => {
            const record = { itemType: 'image', mediaType: 'video', path: '/2024/01-01/video.mp4' } as GalleryRecord;
            expect(isImageRecord(record)).toBe(false);
        });
    });

    // New format (after migration)
    describe('new format (itemType: media)', () => {
        it('isMediaRecord returns true for new image', () => {
            const record = { itemType: 'media', mediaType: 'image', path: '/2024/01-01/photo.jpg' } as GalleryRecord;
            expect(isMediaRecord(record)).toBe(true);
        });

        it('isImageRecord returns true for new image', () => {
            const record = { itemType: 'media', mediaType: 'image', path: '/2024/01-01/photo.jpg' } as GalleryRecord;
            expect(isImageRecord(record)).toBe(true);
        });

        it('isVideoRecord returns true for new video', () => {
            const record = { itemType: 'media', mediaType: 'video', path: '/2024/01-01/video.mp4' } as GalleryRecord;
            expect(isVideoRecord(record)).toBe(true);
        });

        it('isImageRecord returns false for new video', () => {
            const record = { itemType: 'media', mediaType: 'video', path: '/2024/01-01/video.mp4' } as GalleryRecord;
            expect(isImageRecord(record)).toBe(false);
        });
    });

    // Albums should never match
    describe('albums', () => {
        it('isMediaRecord returns false for album', () => {
            const record = { itemType: 'album', path: '/2024/' } as GalleryRecord;
            expect(isMediaRecord(record)).toBe(false);
        });
    });
});
