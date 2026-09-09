import { it, expect, describe } from 'vitest';
import {
    sanitizeMediaFilename,
    sanitizeMediaNameWithoutExtension,
    deduplicateMediaPaths,
    hasValidMediaExtension,
    isValidMediaPath,
    isValidMediaNameWithoutExtensionStrict,
    IMAGE_EXTENSIONS,
    getParentAndNameFromPath,
} from './galleryPathUtils';

describe(sanitizeMediaFilename, () => {
    // Basic transformations
    it('converts to lowercase', () => {
        expect(sanitizeMediaFilename('IMAGE.JPG')).toBe('image.jpg');
        expect(sanitizeMediaFilename('Photo.PNG')).toBe('photo.png');
    });

    it('converts .jpeg to .jpg', () => {
        expect(sanitizeMediaFilename('photo.jpeg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('PHOTO.JPEG')).toBe('photo.jpg');
    });

    // Invalid character handling
    it('converts spaces to underscores', () => {
        expect(sanitizeMediaFilename('my photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeMediaFilename('my  photo.jpg')).toBe('my_photo.jpg');
    });

    it('converts hyphens to underscores', () => {
        expect(sanitizeMediaFilename('my-photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeMediaFilename('my--photo.jpg')).toBe('my_photo.jpg');
    });

    it('converts special characters to underscores', () => {
        expect(sanitizeMediaFilename('photo@home.jpg')).toBe('photo_home.jpg');
        expect(sanitizeMediaFilename('photo#1.jpg')).toBe('photo_1.jpg');
        expect(sanitizeMediaFilename('photo (1).jpg')).toBe('photo_1.jpg');
        expect(sanitizeMediaFilename("photo's.jpg")).toBe('photo_s.jpg');
    });

    // Multiple underscore handling
    it('collapses multiple underscores to single', () => {
        expect(sanitizeMediaFilename('my___photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeMediaFilename('my - photo.jpg')).toBe('my_photo.jpg');
    });

    // Leading/trailing underscore handling
    it('removes leading underscores', () => {
        expect(sanitizeMediaFilename('_photo.jpg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('__photo.jpg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('-photo.jpg')).toBe('photo.jpg');
    });

    it('removes trailing underscores before extension', () => {
        expect(sanitizeMediaFilename('photo_.jpg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('photo__.jpg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('photo-.jpg')).toBe('photo.jpg');
    });

    // Edge cases
    it('handles empty string', () => {
        expect(sanitizeMediaFilename('')).toBe('');
    });

    it('handles already valid names', () => {
        expect(sanitizeMediaFilename('photo.jpg')).toBe('photo.jpg');
        expect(sanitizeMediaFilename('my_photo_1.jpg')).toBe('my_photo_1.jpg');
    });

    it('preserves numbers', () => {
        expect(sanitizeMediaFilename('photo123.jpg')).toBe('photo123.jpg');
        expect(sanitizeMediaFilename('123photo.jpg')).toBe('123photo.jpg');
        expect(sanitizeMediaFilename('photo_1_2_3.jpg')).toBe('photo_1_2_3.jpg');
    });

    it('handles various extensions', () => {
        expect(sanitizeMediaFilename('photo.png')).toBe('photo.png');
        expect(sanitizeMediaFilename('photo.gif')).toBe('photo.gif');
        expect(sanitizeMediaFilename('photo.PNG')).toBe('photo.png');
        expect(sanitizeMediaFilename('photo.GIF')).toBe('photo.gif');
    });

    // Real-world examples from uploads
    it('handles typical camera/phone filenames', () => {
        expect(sanitizeMediaFilename('IMG_1234.JPG')).toBe('img_1234.jpg');
        expect(sanitizeMediaFilename('DSC_0001.jpeg')).toBe('dsc_0001.jpg');
        expect(sanitizeMediaFilename('Photo 2024-01-15.jpg')).toBe('photo_2024_01_15.jpg');
        expect(sanitizeMediaFilename('Screenshot 2024-01-15 at 10.30.45 AM.png')).toBe(
            'screenshot_2024_01_15_at_10_30_45_am.png',
        );
    });
});

describe(hasValidMediaExtension, () => {
    it('accepts standard image extensions', () => {
        expect(hasValidMediaExtension('photo.jpg')).toBe(true);
        expect(hasValidMediaExtension('photo.jpeg')).toBe(true);
        expect(hasValidMediaExtension('photo.png')).toBe(true);
        expect(hasValidMediaExtension('photo.gif')).toBe(true);
    });

    it('accepts HEIC/HEIF extensions', () => {
        expect(hasValidMediaExtension('photo.heic')).toBe(true);
        expect(hasValidMediaExtension('photo.heif')).toBe(true);
        expect(hasValidMediaExtension('photo.HEIC')).toBe(true);
        expect(hasValidMediaExtension('photo.HEIF')).toBe(true);
    });

    it('is case insensitive', () => {
        expect(hasValidMediaExtension('photo.JPG')).toBe(true);
        expect(hasValidMediaExtension('photo.PNG')).toBe(true);
        expect(hasValidMediaExtension('photo.Heic')).toBe(true);
    });

    it('accepts video extensions', () => {
        expect(hasValidMediaExtension('video.mp4')).toBe(true);
        expect(hasValidMediaExtension('video.mov')).toBe(true);
        expect(hasValidMediaExtension('video.mpg')).toBe(true);
        expect(hasValidMediaExtension('video.mpeg')).toBe(true);
        expect(hasValidMediaExtension('video.MPG')).toBe(true);
        expect(hasValidMediaExtension('video.MPEG')).toBe(true);
    });

    it('rejects invalid extensions', () => {
        expect(hasValidMediaExtension('photo.txt')).toBe(false);
        expect(hasValidMediaExtension('photo.pdf')).toBe(false);
        expect(hasValidMediaExtension('photo.webp')).toBe(false);
    });

    it('rejects extension-only filenames', () => {
        expect(hasValidMediaExtension('.jpg')).toBe(false);
        expect(hasValidMediaExtension('.png')).toBe(false);
        expect(hasValidMediaExtension('.heic')).toBe(false);
    });
});

describe(isValidMediaPath, () => {
    it('accepts HEIC/HEIF image paths', () => {
        expect(isValidMediaPath('/2024/01-15/photo.heic')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/photo.heif')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/photo.HEIC')).toBe(true);
    });

    it('accepts standard image paths', () => {
        expect(isValidMediaPath('/2024/01-15/photo.jpg')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/photo.png')).toBe(true);
    });

    it('accepts video paths', () => {
        expect(isValidMediaPath('/2024/01-15/video.mp4')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/video.mov')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/video.mpg')).toBe(true);
        expect(isValidMediaPath('/2024/01-15/video.mpeg')).toBe(true);
    });
});

describe('IMAGE_EXTENSIONS', () => {
    it('includes heic and heif', () => {
        expect(IMAGE_EXTENSIONS).toContain('heic');
        expect(IMAGE_EXTENSIONS).toContain('heif');
    });
});

describe(sanitizeMediaNameWithoutExtension, () => {
    it('converts to lowercase', () => {
        expect(sanitizeMediaNameWithoutExtension('PHOTO')).toBe('photo');
    });

    it('converts invalid chars to underscores', () => {
        expect(sanitizeMediaNameWithoutExtension('my photo')).toBe('my_photo');
        expect(sanitizeMediaNameWithoutExtension('my-photo')).toBe('my_photo');
    });

    it('collapses multiple underscores', () => {
        expect(sanitizeMediaNameWithoutExtension('my___photo')).toBe('my_photo');
    });

    it('removes leading underscores', () => {
        expect(sanitizeMediaNameWithoutExtension('_photo')).toBe('photo');
        expect(sanitizeMediaNameWithoutExtension('-photo')).toBe('photo');
    });

    it('allows trailing underscores (for live typing)', () => {
        // Trailing underscores are intentionally preserved to allow typing underscores
        // mid-name. The strict validator will reject trailing underscores on submit.
        expect(sanitizeMediaNameWithoutExtension('photo_')).toBe('photo_');
        // Hyphens get converted to underscores
        expect(sanitizeMediaNameWithoutExtension('photo-')).toBe('photo_');
    });
});

describe(deduplicateMediaPaths, () => {
    it('returns paths unchanged when no duplicates', () => {
        expect(deduplicateMediaPaths(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg'])).toEqual([
            '/2024/01-01/a.jpg',
            '/2024/01-01/b.jpg',
        ]);
    });

    it('returns empty array for empty input', () => {
        expect(deduplicateMediaPaths([])).toEqual([]);
    });

    it('renames second duplicate with _2 suffix', () => {
        expect(deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg'])).toEqual([
            '/2024/01-01/photo.jpg',
            '/2024/01-01/photo_2.jpg',
        ]);
    });

    it('renames third duplicate with _3 suffix', () => {
        expect(
            deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg']),
        ).toEqual(['/2024/01-01/photo.jpg', '/2024/01-01/photo_2.jpg', '/2024/01-01/photo_3.jpg']);
    });

    it('handles multiple different duplicates', () => {
        expect(
            deduplicateMediaPaths(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg', '/2024/01-01/a.jpg', '/2024/01-01/b.jpg']),
        ).toEqual(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg', '/2024/01-01/a_2.jpg', '/2024/01-01/b_2.jpg']);
    });

    it('handles different extensions', () => {
        expect(deduplicateMediaPaths(['/2024/01-01/photo.png', '/2024/01-01/photo.png'])).toEqual([
            '/2024/01-01/photo.png',
            '/2024/01-01/photo_2.png',
        ]);
    });

    it('does not dedupe different files with same base name but different extensions', () => {
        expect(deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.png'])).toEqual([
            '/2024/01-01/photo.jpg',
            '/2024/01-01/photo.png',
        ]);
    });

    it('avoids collision when generated name matches existing file', () => {
        // photo_2.jpg already exists, so the duplicate of photo.jpg should become photo_3.jpg
        expect(
            deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo_2.jpg']),
        ).toEqual(['/2024/01-01/photo.jpg', '/2024/01-01/photo_3.jpg', '/2024/01-01/photo_2.jpg']);
    });

    it('avoids collision when existing file comes before duplicates', () => {
        // photo_2.jpg comes first, then duplicates of photo.jpg should skip _2
        expect(
            deduplicateMediaPaths(['/2024/01-01/photo_2.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg']),
        ).toEqual(['/2024/01-01/photo_2.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo_3.jpg']);
    });
});

describe(isValidMediaNameWithoutExtensionStrict, () => {
    it('accepts valid lowercase alphanumeric names', () => {
        expect(isValidMediaNameWithoutExtensionStrict('photo')).toBe(true);
        expect(isValidMediaNameWithoutExtensionStrict('photo1')).toBe(true);
        expect(isValidMediaNameWithoutExtensionStrict('1photo')).toBe(true);
        expect(isValidMediaNameWithoutExtensionStrict('123')).toBe(true);
        expect(isValidMediaNameWithoutExtensionStrict('a')).toBe(true);
        expect(isValidMediaNameWithoutExtensionStrict('1')).toBe(true);
    });

    it('accepts names with underscores in the middle', () => {
        expect(isValidMediaNameWithoutExtensionStrict('my_photo')).toBe(true);
        expect(isValidMediaNameWithoutExtensionStrict('my_photo_1')).toBe(true);
        expect(isValidMediaNameWithoutExtensionStrict('a_b_c_d')).toBe(true);
        expect(isValidMediaNameWithoutExtensionStrict('photo_1_2_3')).toBe(true);
        expect(isValidMediaNameWithoutExtensionStrict('1_2')).toBe(true);
    });

    it('rejects names with consecutive underscores', () => {
        expect(isValidMediaNameWithoutExtensionStrict('a__b')).toBe(false);
        expect(isValidMediaNameWithoutExtensionStrict('photo__1')).toBe(false);
        expect(isValidMediaNameWithoutExtensionStrict('a___b')).toBe(false);
    });

    it('rejects names with leading underscores', () => {
        expect(isValidMediaNameWithoutExtensionStrict('_photo')).toBe(false);
        expect(isValidMediaNameWithoutExtensionStrict('__photo')).toBe(false);
    });

    it('rejects names with trailing underscores', () => {
        expect(isValidMediaNameWithoutExtensionStrict('photo_')).toBe(false);
        expect(isValidMediaNameWithoutExtensionStrict('photo__')).toBe(false);
    });

    it('rejects names with uppercase letters', () => {
        expect(isValidMediaNameWithoutExtensionStrict('Photo')).toBe(false);
        expect(isValidMediaNameWithoutExtensionStrict('PHOTO')).toBe(false);
        expect(isValidMediaNameWithoutExtensionStrict('myPhoto')).toBe(false);
    });

    it('rejects names with hyphens', () => {
        expect(isValidMediaNameWithoutExtensionStrict('my-photo')).toBe(false);
        expect(isValidMediaNameWithoutExtensionStrict('photo-1')).toBe(false);
    });

    it('rejects names with spaces or special characters', () => {
        expect(isValidMediaNameWithoutExtensionStrict('my photo')).toBe(false);
        expect(isValidMediaNameWithoutExtensionStrict('photo@1')).toBe(false);
        expect(isValidMediaNameWithoutExtensionStrict('photo.jpg')).toBe(false);
    });

    it('rejects empty string', () => {
        expect(isValidMediaNameWithoutExtensionStrict('')).toBe(false);
    });

    it('rejects underscore-only strings', () => {
        expect(isValidMediaNameWithoutExtensionStrict('_')).toBe(false);
        expect(isValidMediaNameWithoutExtensionStrict('__')).toBe(false);
        expect(isValidMediaNameWithoutExtensionStrict('___')).toBe(false);
    });

    // ReDoS (Regular Expression Denial of Service) prevention test
    // The old regex pattern /^[a-z0-9]+([a-z0-9_]*[a-z0-9]+)*$/ had nested quantifiers
    // that caused catastrophic backtracking, hanging for 100+ seconds on certain inputs.
    // The 50ms timeout ensures the test fails if the regex causes backtracking.
    it('handles long filenames with multiple underscores without hanging (ReDoS prevention)', () => {
        const longValidName = 'monkey_river_15_howler_monkey_calling';
        const longInvalidName = 'monkey_river_15_howler_monkey_calling_';

        expect(isValidMediaNameWithoutExtensionStrict(longValidName)).toBe(true);
        expect(isValidMediaNameWithoutExtensionStrict(longInvalidName)).toBe(false);
    }, 50); // 50ms timeout - test will fail if regex causes backtracking
});

describe(getParentAndNameFromPath, () => {
    it('splits a media path into day album and filename', () => {
        expect(getParentAndNameFromPath('/2001/12-31/image.jpg')).toEqual({
            parent: '/2001/12-31/',
            name: 'image.jpg',
        });
        expect(getParentAndNameFromPath('/2001/12-31/video.mp4')).toEqual({
            parent: '/2001/12-31/',
            name: 'video.mp4',
        });
    });

    it('splits a day album path into year album and day', () => {
        expect(getParentAndNameFromPath('/2001/12-31/')).toEqual({ parent: '/2001/', name: '12-31' });
    });

    it('splits a year album path into root and year', () => {
        expect(getParentAndNameFromPath('/2001/')).toEqual({ parent: '/', name: '2001' });
    });

    it('returns empty parent and name for the root album', () => {
        expect(getParentAndNameFromPath('/')).toEqual({ parent: '', name: '' });
    });

    it('trims surrounding whitespace', () => {
        expect(getParentAndNameFromPath('  /2001/12-31/  ')).toEqual({ parent: '/2001/', name: '12-31' });
    });

    // Album paths are only valid with a trailing slash, so these throw rather
    // than being treated as /2001/12-31/ and /2001/
    it('throws on an album path with no trailing slash', () => {
        expect(() => getParentAndNameFromPath('/2001/12-31')).toThrow('Invalid path: [/2001/12-31]');
        expect(() => getParentAndNameFromPath('/2001')).toThrow('Invalid path: [/2001]');
    });

    it('throws on an empty path', () => {
        expect(() => getParentAndNameFromPath('')).toThrow('Invalid path: cannot be empty');
        expect(() => getParentAndNameFromPath('   ')).toThrow('Invalid path: cannot be empty');
    });

    it('throws on a path that is not a gallery path', () => {
        expect(() => getParentAndNameFromPath('nonsense')).toThrow('Invalid path: [nonsense]');
    });
});
