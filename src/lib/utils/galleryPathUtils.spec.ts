import { test, expect, describe } from 'vitest';
import {
    sanitizeMediaFilename,
    sanitizeMediaNameWithoutExtension,
    deduplicateMediaPaths,
    hasValidMediaExtension,
    isValidMediaPath,
    IMAGE_EXTENSIONS,
} from './galleryPathUtils';

describe('sanitizeImageName', () => {
    // Basic transformations
    test('converts to lowercase', () => {
        expect(sanitizeMediaFilename('IMAGE.JPG')).toBe('image.jpg');
        expect(sanitizeMediaFilename('Photo.PNG')).toBe('photo.png');
    });

    test('converts .jpeg to .jpg', () => {
        expect(sanitizeMediaFilename('photo.jpeg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('PHOTO.JPEG')).toBe('photo.jpg');
    });

    // Invalid character handling
    test('converts spaces to underscores', () => {
        expect(sanitizeMediaFilename('my photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeMediaFilename('my  photo.jpg')).toBe('my_photo.jpg');
    });

    test('converts hyphens to underscores', () => {
        expect(sanitizeMediaFilename('my-photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeMediaFilename('my--photo.jpg')).toBe('my_photo.jpg');
    });

    test('converts special characters to underscores', () => {
        expect(sanitizeMediaFilename('photo@home.jpg')).toBe('photo_home.jpg');
        expect(sanitizeMediaFilename('photo#1.jpg')).toBe('photo_1.jpg');
        expect(sanitizeMediaFilename('photo (1).jpg')).toBe('photo_1.jpg');
        expect(sanitizeMediaFilename("photo's.jpg")).toBe('photo_s.jpg');
    });

    // Multiple underscore handling
    test('collapses multiple underscores to single', () => {
        expect(sanitizeMediaFilename('my___photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeMediaFilename('my - photo.jpg')).toBe('my_photo.jpg');
    });

    // Leading/trailing underscore handling
    test('removes leading underscores', () => {
        expect(sanitizeMediaFilename('_photo.jpg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('__photo.jpg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('-photo.jpg')).toBe('photo.jpg');
    });

    test('removes trailing underscores before extension', () => {
        expect(sanitizeMediaFilename('photo_.jpg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('photo__.jpg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('photo-.jpg')).toBe('photo.jpg');
    });

    // Edge cases
    test('handles empty string', () => {
        expect(sanitizeMediaFilename('')).toBe('');
    });

    test('handles already valid names', () => {
        expect(sanitizeMediaFilename('photo.jpg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('my_photo_1.jpg')).toBe('my_photo_1.jpg');
    });

    test('preserves numbers', () => {
        expect(sanitizeMediaFilename('photo123.jpg')).toBe('photo123.jpg');
        expect(sanitizeMediaFilename('123photo.jpg')).toBe('123photo.jpg');
        expect(sanitizeMediaFilename('photo_1_2_3.jpg')).toBe('photo_1_2_3.jpg');
    });

    test('handles various extensions', () => {
        expect(sanitizeMediaFilename('photo.png')).toBe('photo.png');
        expect(sanitizeMediaFilename('photo.gif')).toBe('photo.gif');
        expect(sanitizeMediaFilename('photo.PNG')).toBe('photo.png');
        expect(sanitizeMediaFilename('photo.GIF')).toBe('photo.gif');
    });

    // Real-world examples from uploads
    test('handles typical camera/phone filenames', () => {
        expect(sanitizeMediaFilename('IMG_1234.JPG')).toBe('img_1234.jpg');
        expect(sanitizeMediaFilename('DSC_0001.jpeg')).toBe('dsc_0001.jpg');
        expect(sanitizeMediaFilename('Photo 2024-01-15.jpg')).toBe('photo_2024_01_15.jpg');
        expect(sanitizeMediaFilename('Screenshot 2024-01-15 at 10.30.45 AM.png')).toBe(
            'screenshot_2024_01_15_at_10_30_45_am.png',
        );
    });
});

describe('hasValidExtension', () => {
    test('accepts standard image extensions', () => {
        expect(hasValidMediaExtension('photo.jpg')).toBe(true);
        expect(hasValidMediaExtension('photo.jpeg')).toBe(true);
        expect(hasValidMediaExtension('photo.png')).toBe(true);
        expect(hasValidMediaExtension('photo.gif')).toBe(true);
    });

    test('accepts HEIC/HEIF extensions', () => {
        expect(hasValidMediaExtension('photo.heic')).toBe(true);
        expect(hasValidMediaExtension('photo.heif')).toBe(true);
        expect(hasValidMediaExtension('photo.HEIC')).toBe(true);
        expect(hasValidMediaExtension('photo.HEIF')).toBe(true);
    });

    test('is case insensitive', () => {
        expect(hasValidMediaExtension('photo.JPG')).toBe(true);
        expect(hasValidMediaExtension('photo.PNG')).toBe(true);
        expect(hasValidMediaExtension('photo.Heic')).toBe(true);
    });

    test('accepts video extensions', () => {
        expect(hasValidMediaExtension('video.mp4')).toBe(true);
        expect(hasValidMediaExtension('video.mov')).toBe(true);
        expect(hasValidMediaExtension('video.mpg')).toBe(true);
        expect(hasValidMediaExtension('video.mpeg')).toBe(true);
        expect(hasValidMediaExtension('video.MPG')).toBe(true);
        expect(hasValidMediaExtension('video.MPEG')).toBe(true);
    });

    test('rejects invalid extensions', () => {
        expect(hasValidMediaExtension('photo.txt')).toBe(false);
        expect(hasValidMediaExtension('photo.pdf')).toBe(false);
        expect(hasValidMediaExtension('photo.webp')).toBe(false);
    });

    test('rejects extension-only filenames', () => {
        expect(hasValidMediaExtension('.jpg')).toBe(false);
        expect(hasValidMediaExtension('.png')).toBe(false);
        expect(hasValidMediaExtension('.heic')).toBe(false);
    });
});

describe('isValidMediaPath', () => {
    test('accepts HEIC/HEIF image paths', () => {
        expect(isValidMediaPath('/2024/01-15/photo.heic')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/photo.heif')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/photo.HEIC')).toBe(true);
    });

    test('accepts standard image paths', () => {
        expect(isValidMediaPath('/2024/01-15/photo.jpg')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/photo.png')).toBe(true);
    });

    test('accepts video paths', () => {
        expect(isValidMediaPath('/2024/01-15/video.mp4')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/video.mov')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/video.mpg')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/video.mpeg')).toBe(true);
    });
});

describe('IMAGE_EXTENSIONS', () => {
    test('includes heic and heif', () => {
        expect(IMAGE_EXTENSIONS).toContain('heic');
        expect(IMAGE_EXTENSIONS).toContain('heif');
    });
});

describe('sanitizeMediaNameWithoutExtension', () => {
    test('converts to lowercase', () => {
        expect(sanitizeMediaNameWithoutExtension('PHOTO')).toBe('photo');
    });

    test('converts invalid chars to underscores', () => {
        expect(sanitizeMediaNameWithoutExtension('my photo')).toBe('my_photo');
        expect(sanitizeMediaNameWithoutExtension('my-photo')).toBe('my_photo');
    });

    test('collapses multiple underscores', () => {
        expect(sanitizeMediaNameWithoutExtension('my___photo')).toBe('my_photo');
    });

    test('removes leading underscores', () => {
        expect(sanitizeMediaNameWithoutExtension('_photo')).toBe('photo');
        expect(sanitizeMediaNameWithoutExtension('-photo')).toBe('photo');
    });

    test('removes trailing underscores', () => {
        expect(sanitizeMediaNameWithoutExtension('photo_')).toBe('photo');
        expect(sanitizeMediaNameWithoutExtension('photo-')).toBe('photo');
    });
});

describe('deduplicateImagePaths', () => {
    test('returns paths unchanged when no duplicates', () => {
        expect(deduplicateMediaPaths(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg'])).toEqual([
            '/2024/01-01/a.jpg',
            '/2024/01-01/b.jpg',
        ]);
    });

    test('returns empty array for empty input', () => {
        expect(deduplicateMediaPaths([])).toEqual([]);
    });

    test('renames second duplicate with _2 suffix', () => {
        expect(deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg'])).toEqual([
            '/2024/01-01/photo.jpg',
            '/2024/01-01/photo_2.jpg',
        ]);
    });

    test('renames third duplicate with _3 suffix', () => {
        expect(
            deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg']),
        ).toEqual(['/2024/01-01/photo.jpg', '/2024/01-01/photo_2.jpg', '/2024/01-01/photo_3.jpg']);
    });

    test('handles multiple different duplicates', () => {
        expect(
            deduplicateMediaPaths(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg', '/2024/01-01/a.jpg', '/2024/01-01/b.jpg']),
        ).toEqual(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg', '/2024/01-01/a_2.jpg', '/2024/01-01/b_2.jpg']);
    });

    test('handles different extensions', () => {
        expect(deduplicateMediaPaths(['/2024/01-01/photo.png', '/2024/01-01/photo.png'])).toEqual([
            '/2024/01-01/photo.png',
            '/2024/01-01/photo_2.png',
        ]);
    });

    test('does not dedupe different files with same base name but different extensions', () => {
        expect(deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.png'])).toEqual([
            '/2024/01-01/photo.jpg',
            '/2024/01-01/photo.png',
        ]);
    });

    test('avoids collision when generated name matches existing file', () => {
        // photo_2.jpg already exists, so the duplicate of photo.jpg should become photo_3.jpg
        expect(
            deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo_2.jpg']),
        ).toEqual(['/2024/01-01/photo.jpg', '/2024/01-01/photo_3.jpg', '/2024/01-01/photo_2.jpg']);
    });

    test('avoids collision when existing file comes before duplicates', () => {
        // photo_2.jpg comes first, then duplicates of photo.jpg should skip _2
        expect(
            deduplicateMediaPaths(['/2024/01-01/photo_2.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg']),
        ).toEqual(['/2024/01-01/photo_2.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo_3.jpg']);
    });
});
