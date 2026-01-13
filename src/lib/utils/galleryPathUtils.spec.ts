import { test, expect, describe } from 'vitest';
import {
    sanitizeImageName,
    deduplicateImagePaths,
    hasValidExtension,
    isValidImagePath,
    validFileExtensions,
} from './galleryPathUtils';

describe('sanitizeImageName', () => {
    // Basic transformations
    test('converts to lowercase', () => {
        expect(sanitizeImageName('IMAGE.JPG')).toBe('image.jpg');
        expect(sanitizeImageName('Photo.PNG')).toBe('photo.png');
    });

    test('converts .jpeg to .jpg', () => {
        expect(sanitizeImageName('photo.jpeg')).toBe('photo.jpg');
        expect(sanitizeImageName('PHOTO.JPEG')).toBe('photo.jpg');
    });

    // Invalid character handling
    test('converts spaces to underscores', () => {
        expect(sanitizeImageName('my photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeImageName('my  photo.jpg')).toBe('my_photo.jpg');
    });

    test('converts hyphens to underscores', () => {
        expect(sanitizeImageName('my-photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeImageName('my--photo.jpg')).toBe('my_photo.jpg');
    });

    test('converts special characters to underscores', () => {
        expect(sanitizeImageName('photo@home.jpg')).toBe('photo_home.jpg');
        expect(sanitizeImageName('photo#1.jpg')).toBe('photo_1.jpg');
        expect(sanitizeImageName('photo (1).jpg')).toBe('photo_1.jpg');
        expect(sanitizeImageName("photo's.jpg")).toBe('photo_s.jpg');
    });

    // Multiple underscore handling
    test('collapses multiple underscores to single', () => {
        expect(sanitizeImageName('my___photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeImageName('my - photo.jpg')).toBe('my_photo.jpg');
    });

    // Leading/trailing underscore handling
    test('removes leading underscores', () => {
        expect(sanitizeImageName('_photo.jpg')).toBe('photo.jpg');
        expect(sanitizeImageName('__photo.jpg')).toBe('photo.jpg');
        expect(sanitizeImageName('-photo.jpg')).toBe('photo.jpg');
    });

    test('removes trailing underscores before extension', () => {
        expect(sanitizeImageName('photo_.jpg')).toBe('photo.jpg');
        expect(sanitizeImageName('photo__.jpg')).toBe('photo.jpg');
        expect(sanitizeImageName('photo-.jpg')).toBe('photo.jpg');
    });

    // Edge cases
    test('handles empty string', () => {
        expect(sanitizeImageName('')).toBe('');
    });

    test('handles already valid names', () => {
        expect(sanitizeImageName('photo.jpg')).toBe('photo.jpg');
        expect(sanitizeImageName('my_photo_1.jpg')).toBe('my_photo_1.jpg');
    });

    test('preserves numbers', () => {
        expect(sanitizeImageName('photo123.jpg')).toBe('photo123.jpg');
        expect(sanitizeImageName('123photo.jpg')).toBe('123photo.jpg');
        expect(sanitizeImageName('photo_1_2_3.jpg')).toBe('photo_1_2_3.jpg');
    });

    test('handles various extensions', () => {
        expect(sanitizeImageName('photo.png')).toBe('photo.png');
        expect(sanitizeImageName('photo.gif')).toBe('photo.gif');
        expect(sanitizeImageName('photo.PNG')).toBe('photo.png');
        expect(sanitizeImageName('photo.GIF')).toBe('photo.gif');
    });

    // Real-world examples from uploads
    test('handles typical camera/phone filenames', () => {
        expect(sanitizeImageName('IMG_1234.JPG')).toBe('img_1234.jpg');
        expect(sanitizeImageName('DSC_0001.jpeg')).toBe('dsc_0001.jpg');
        expect(sanitizeImageName('Photo 2024-01-15.jpg')).toBe('photo_2024_01_15.jpg');
        expect(sanitizeImageName('Screenshot 2024-01-15 at 10.30.45 AM.png')).toBe(
            'screenshot_2024_01_15_at_10.30.45_am.png',
        );
    });
});

describe('hasValidExtension', () => {
    test('accepts standard image extensions', () => {
        expect(hasValidExtension('photo.jpg')).toBe(true);
        expect(hasValidExtension('photo.jpeg')).toBe(true);
        expect(hasValidExtension('photo.png')).toBe(true);
        expect(hasValidExtension('photo.gif')).toBe(true);
    });

    test('accepts HEIC/HEIF extensions', () => {
        expect(hasValidExtension('photo.heic')).toBe(true);
        expect(hasValidExtension('photo.heif')).toBe(true);
        expect(hasValidExtension('photo.HEIC')).toBe(true);
        expect(hasValidExtension('photo.HEIF')).toBe(true);
    });

    test('is case insensitive', () => {
        expect(hasValidExtension('photo.JPG')).toBe(true);
        expect(hasValidExtension('photo.PNG')).toBe(true);
        expect(hasValidExtension('photo.Heic')).toBe(true);
    });

    test('rejects invalid extensions', () => {
        expect(hasValidExtension('photo.txt')).toBe(false);
        expect(hasValidExtension('photo.pdf')).toBe(false);
        expect(hasValidExtension('photo.webp')).toBe(false);
    });

    test('rejects extension-only filenames', () => {
        expect(hasValidExtension('.jpg')).toBe(false);
        expect(hasValidExtension('.png')).toBe(false);
        expect(hasValidExtension('.heic')).toBe(false);
    });
});

describe('isValidImagePath', () => {
    test('accepts HEIC/HEIF image paths', () => {
        expect(isValidImagePath('/2024/01-15/photo.heic')).toBe(true);
        expect(isValidImagePath('/2024/01-15/photo.heif')).toBe(true);
        expect(isValidImagePath('/2024/01-15/photo.HEIC')).toBe(true);
    });

    test('accepts standard image paths', () => {
        expect(isValidImagePath('/2024/01-15/photo.jpg')).toBe(true);
        expect(isValidImagePath('/2024/01-15/photo.png')).toBe(true);
    });
});

describe('validFileExtensions', () => {
    test('includes heic and heif', () => {
        const extensions = validFileExtensions();
        expect(extensions).toContain('heic');
        expect(extensions).toContain('heif');
    });
});

describe('deduplicateImagePaths', () => {
    test('returns paths unchanged when no duplicates', () => {
        expect(deduplicateImagePaths(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg'])).toEqual([
            '/2024/01-01/a.jpg',
            '/2024/01-01/b.jpg',
        ]);
    });

    test('returns empty array for empty input', () => {
        expect(deduplicateImagePaths([])).toEqual([]);
    });

    test('renames second duplicate with _2 suffix', () => {
        expect(deduplicateImagePaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg'])).toEqual([
            '/2024/01-01/photo.jpg',
            '/2024/01-01/photo_2.jpg',
        ]);
    });

    test('renames third duplicate with _3 suffix', () => {
        expect(
            deduplicateImagePaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg']),
        ).toEqual(['/2024/01-01/photo.jpg', '/2024/01-01/photo_2.jpg', '/2024/01-01/photo_3.jpg']);
    });

    test('handles multiple different duplicates', () => {
        expect(
            deduplicateImagePaths(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg', '/2024/01-01/a.jpg', '/2024/01-01/b.jpg']),
        ).toEqual(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg', '/2024/01-01/a_2.jpg', '/2024/01-01/b_2.jpg']);
    });

    test('handles different extensions', () => {
        expect(deduplicateImagePaths(['/2024/01-01/photo.png', '/2024/01-01/photo.png'])).toEqual([
            '/2024/01-01/photo.png',
            '/2024/01-01/photo_2.png',
        ]);
    });

    test('does not dedupe different files with same base name but different extensions', () => {
        expect(deduplicateImagePaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.png'])).toEqual([
            '/2024/01-01/photo.jpg',
            '/2024/01-01/photo.png',
        ]);
    });

    test('avoids collision when generated name matches existing file', () => {
        // photo_2.jpg already exists, so the duplicate of photo.jpg should become photo_3.jpg
        expect(
            deduplicateImagePaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo_2.jpg']),
        ).toEqual(['/2024/01-01/photo.jpg', '/2024/01-01/photo_3.jpg', '/2024/01-01/photo_2.jpg']);
    });

    test('avoids collision when existing file comes before duplicates', () => {
        // photo_2.jpg comes first, then duplicates of photo.jpg should skip _2
        expect(
            deduplicateImagePaths(['/2024/01-01/photo_2.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg']),
        ).toEqual(['/2024/01-01/photo_2.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo_3.jpg']);
    });
});
