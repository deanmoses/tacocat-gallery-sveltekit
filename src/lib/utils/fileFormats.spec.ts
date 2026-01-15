import { describe, it, expect } from 'vitest';
import { getImagePath, isRenamedOnServer, browserCanDisplay } from './fileFormats';

describe('fileFormats', () => {
    describe('getPathAfterServerProcessing', () => {
        it('converts HEIC to JPG', () => {
            expect(getImagePath('/2024/01-01/photo.heic')).toBe('/2024/01-01/photo.jpg');
        });

        it('converts HEIF to JPG', () => {
            expect(getImagePath('/2024/01-01/photo.heif')).toBe('/2024/01-01/photo.jpg');
        });

        it('handles uppercase HEIC', () => {
            expect(getImagePath('/2024/01-01/photo.HEIC')).toBe('/2024/01-01/photo.jpg');
        });

        it('returns same path for JPG', () => {
            expect(getImagePath('/2024/01-01/photo.jpg')).toBe('/2024/01-01/photo.jpg');
        });

        it('returns same path for PNG', () => {
            expect(getImagePath('/2024/01-01/photo.png')).toBe('/2024/01-01/photo.png');
        });
    });

    describe('isRenamedOnServer', () => {
        it('returns true for HEIC', () => {
            expect(isRenamedOnServer('/2024/01-01/photo.heic')).toBe(true);
        });

        it('returns true for HEIF', () => {
            expect(isRenamedOnServer('/2024/01-01/photo.heif')).toBe(true);
        });

        it('returns false for JPG', () => {
            expect(isRenamedOnServer('/2024/01-01/photo.jpg')).toBe(false);
        });

        it('returns false for PNG', () => {
            expect(isRenamedOnServer('/2024/01-01/photo.png')).toBe(false);
        });
    });

    describe('browserCanDisplay', () => {
        it('returns false for HEIC files', () => {
            expect(browserCanDisplay('photo.heic')).toBe(false);
        });

        it('returns false for HEIF files', () => {
            expect(browserCanDisplay('photo.heif')).toBe(false);
        });

        it('returns false for full path with HEIC', () => {
            expect(browserCanDisplay('/2024/01-01/photo.heic')).toBe(false);
        });

        it('returns true for JPG files', () => {
            expect(browserCanDisplay('photo.jpg')).toBe(true);
        });

        it('returns true for PNG files', () => {
            expect(browserCanDisplay('photo.png')).toBe(true);
        });
    });
});
