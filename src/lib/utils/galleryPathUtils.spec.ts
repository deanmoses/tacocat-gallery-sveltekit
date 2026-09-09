import { it, expect, describe } from 'vitest';
import {
    sanitizeMediaFilename,
    sanitizeMediaNameWithoutExtension,
    sanitizeDayAlbumName,
    deduplicateMediaPaths,
    hasValidMediaExtension,
    validMediaExtensionsString,
    isValidPath,
    isValidAlbumPath,
    isValidYearAlbumPath,
    isValidDayAlbumPath,
    isValidMediaPath,
    isValidMediaNameWithoutExtensionStrict,
    IMAGE_EXTENSIONS,
    albumPathToDate,
    getParentAndNameFromPath,
    getParentFromPath,
    getNameFromPath,
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

/**
 * The five path predicates carve up one space of strings, so they are asserted
 * against one table of paths rather than each against its own examples. Nothing
 * previously checked what they reject -- isValidMediaPath accepted media in a
 * year album and no test noticed -- and a shared table makes a predicate that
 * quietly widens fail somewhere.
 *
 * Validation here is syntactic. A path is well-formed or not; whether the date
 * it names exists in the calendar is not this module's question.
 */
type PathCase = {
    path: string;
    isPath: boolean;
    isAlbum: boolean;
    isYear: boolean;
    isDay: boolean;
    isMedia: boolean;
};

/** Builds a row, defaulting every predicate to false so a row states only what it accepts */
function pathCase(path: string, accepted: Partial<Omit<PathCase, 'path'>> = {}): PathCase {
    return { path, isPath: false, isAlbum: false, isYear: false, isDay: false, isMedia: false, ...accepted };
}

const PATH_CASES: PathCase[] = [
    // The three album levels
    pathCase('/', { isPath: true, isAlbum: true }),
    pathCase('/2001/', { isPath: true, isAlbum: true, isYear: true }),
    pathCase('/2001/12-31/', { isPath: true, isAlbum: true, isDay: true }),

    // Media, which lives only in day albums
    pathCase('/2001/12-31/image.jpg', { isPath: true, isMedia: true }),
    pathCase('/2001/12-31/image.HEIC', { isPath: true, isMedia: true }),
    pathCase('/2001/12-31/video.mp4', { isPath: true, isMedia: true }),
    pathCase('/2001/12-31/my_image_1.jpg', { isPath: true, isMedia: true }),
    pathCase('/2001/12-31/my-image.jpg', { isPath: true, isMedia: true }),

    // Media anywhere else is not a path at all
    pathCase('/image.jpg'),
    pathCase('/2001/image.jpg'),
    pathCase('/2001/12-31/sub/image.jpg'),

    // Album paths are only valid with a trailing slash
    pathCase('/2001'),
    pathCase('/2001/12-31'),
    pathCase('2001/'),
    pathCase('/2001/12-31/image.jpg/'),

    // Month and day are range-checked, but not against a real calendar
    pathCase('/2001/02-30/', { isPath: true, isAlbum: true, isDay: true }),
    pathCase('/2001/00-31/'),
    pathCase('/2001/13-31/'),
    pathCase('/2001/12-00/'),
    pathCase('/2001/12-32/'),
    pathCase('/2001/1-31/'),
    pathCase('/2001/12-1/'),

    // The year is four digits, no more and no fewer
    pathCase('/201/'),
    pathCase('/20011/'),
    pathCase('/abcd/'),

    // Filenames carry a supported extension and no spaces
    pathCase('/2001/12-31/image.txt'),
    pathCase('/2001/12-31/image'),
    pathCase('/2001/12-31/.jpg'),
    pathCase('/2001/12-31/my image.jpg'),

    pathCase(''),
];

describe(isValidPath, () => {
    it.each(PATH_CASES)('$path: $isPath', ({ path, isPath }) => {
        expect(isValidPath(path)).toBe(isPath);
    });
});

describe(isValidAlbumPath, () => {
    it.each(PATH_CASES)('$path: $isAlbum', ({ path, isAlbum }) => {
        expect(isValidAlbumPath(path)).toBe(isAlbum);
    });
});

describe(isValidYearAlbumPath, () => {
    it.each(PATH_CASES)('$path: $isYear', ({ path, isYear }) => {
        expect(isValidYearAlbumPath(path)).toBe(isYear);
    });
});

describe(isValidDayAlbumPath, () => {
    it.each(PATH_CASES)('$path: $isDay', ({ path, isDay }) => {
        expect(isValidDayAlbumPath(path)).toBe(isDay);
    });
});

describe(isValidMediaPath, () => {
    it.each(PATH_CASES)('$path: $isMedia', ({ path, isMedia }) => {
        expect(isValidMediaPath(path)).toBe(isMedia);
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
        expect(deduplicateMediaPaths(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg'])).toStrictEqual([
            '/2024/01-01/a.jpg',
            '/2024/01-01/b.jpg',
        ]);
    });

    it('returns empty array for empty input', () => {
        expect(deduplicateMediaPaths([])).toStrictEqual([]);
    });

    it('renames second duplicate with _2 suffix', () => {
        expect(deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg'])).toStrictEqual([
            '/2024/01-01/photo.jpg',
            '/2024/01-01/photo_2.jpg',
        ]);
    });

    it('renames third duplicate with _3 suffix', () => {
        expect(
            deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg']),
        ).toStrictEqual(['/2024/01-01/photo.jpg', '/2024/01-01/photo_2.jpg', '/2024/01-01/photo_3.jpg']);
    });

    it('handles multiple different duplicates', () => {
        expect(
            deduplicateMediaPaths(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg', '/2024/01-01/a.jpg', '/2024/01-01/b.jpg']),
        ).toStrictEqual(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg', '/2024/01-01/a_2.jpg', '/2024/01-01/b_2.jpg']);
    });

    it('handles different extensions', () => {
        expect(deduplicateMediaPaths(['/2024/01-01/photo.png', '/2024/01-01/photo.png'])).toStrictEqual([
            '/2024/01-01/photo.png',
            '/2024/01-01/photo_2.png',
        ]);
    });

    it('does not dedupe different files with same base name but different extensions', () => {
        expect(deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.png'])).toStrictEqual([
            '/2024/01-01/photo.jpg',
            '/2024/01-01/photo.png',
        ]);
    });

    it('avoids collision when generated name matches existing file', () => {
        // photo_2.jpg already exists, so the duplicate of photo.jpg should become photo_3.jpg
        expect(
            deduplicateMediaPaths(['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo_2.jpg']),
        ).toStrictEqual(['/2024/01-01/photo.jpg', '/2024/01-01/photo_3.jpg', '/2024/01-01/photo_2.jpg']);
    });

    it('avoids collision when existing file comes before duplicates', () => {
        // photo_2.jpg comes first, then duplicates of photo.jpg should skip _2
        expect(
            deduplicateMediaPaths(['/2024/01-01/photo_2.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg']),
        ).toStrictEqual(['/2024/01-01/photo_2.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo_3.jpg']);
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
        expect(getParentAndNameFromPath('/2001/12-31/image.jpg')).toStrictEqual({
            parent: '/2001/12-31/',
            name: 'image.jpg',
        });
        expect(getParentAndNameFromPath('/2001/12-31/video.mp4')).toStrictEqual({
            parent: '/2001/12-31/',
            name: 'video.mp4',
        });
    });

    it('splits a day album path into year album and day', () => {
        expect(getParentAndNameFromPath('/2001/12-31/')).toStrictEqual({ parent: '/2001/', name: '12-31' });
    });

    it('splits a year album path into root and year', () => {
        expect(getParentAndNameFromPath('/2001/')).toStrictEqual({ parent: '/', name: '2001' });
    });

    it('returns empty parent and name for the root album', () => {
        expect(getParentAndNameFromPath('/')).toStrictEqual({ parent: '', name: '' });
    });

    it('trims surrounding whitespace', () => {
        expect(getParentAndNameFromPath('  /2001/12-31/  ')).toStrictEqual({ parent: '/2001/', name: '12-31' });
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

describe(getParentFromPath, () => {
    it.each([
        { path: '/2001/12-31/image.jpg', parent: '/2001/12-31/' },
        { path: '/2001/12-31/', parent: '/2001/' },
        { path: '/2001/', parent: '/' },
        // The root album has no parent. Represented as empty rather than
        // undefined, which the module's own docs flag as questionable.
        { path: '/', parent: '' },
    ])('$path has parent [$parent]', ({ path, parent }) => {
        expect(getParentFromPath(path)).toBe(parent);
    });

    it('throws on a path that is not valid', () => {
        expect(() => getParentFromPath('/2001/12-31')).toThrow('Invalid path: [/2001/12-31]');
    });
});

describe(getNameFromPath, () => {
    it.each([
        { path: '/2001/12-31/image.jpg', name: 'image.jpg' },
        { path: '/2001/12-31/', name: '12-31' },
        { path: '/2001/', name: '2001' },
        { path: '/', name: '' },
    ])('$path has name [$name]', ({ path, name }) => {
        expect(getNameFromPath(path)).toBe(name);
    });

    it('throws on a path that is not valid', () => {
        expect(() => getNameFromPath('/2001/12-31')).toThrow('Invalid path: [/2001/12-31]');
    });
});

describe(albumPathToDate, () => {
    // Compared as local-time components rather than against a constructed Date,
    // so the assertion says which year, month and day is meant and does not
    // restate the implementation's own call.
    it.each([
        // Albums are sorted by date, so the root needs one. It is the date of
        // the first surviving photograph, which sorts before any real album.
        { albumPath: '/', year: 1826, month: 0, day: 1 },
        // A year album stands at its first day
        { albumPath: '/2001/', year: 2001, month: 0, day: 1 },
        { albumPath: '/2001/12-31/', year: 2001, month: 11, day: 31 },
        { albumPath: '/2001/01-01/', year: 2001, month: 0, day: 1 },
        { albumPath: '/2001/06-15/', year: 2001, month: 5, day: 15 },
    ])('$albumPath is $year-$month-$day', ({ albumPath, year, month, day }) => {
        const date = albumPathToDate(albumPath);

        expect([date.getFullYear(), date.getMonth(), date.getDate()]).toStrictEqual([year, month, day]);
    });

    it.each(['/2001/12-31/image.jpg', '/2001/12-31', '/2001', '/2001/13-01/', '', 'nonsense'])(
        'throws on %s, which is not an album path',
        (albumPath) => {
            expect(() => albumPathToDate(albumPath)).toThrow(`Invalid album path: [${albumPath}]`);
        },
    );
});

describe(sanitizeDayAlbumName, () => {
    it.each([
        // Already valid names survive untouched
        { in: '12-31', out: '12-31' },
        { in: '01-01', out: '01-01' },

        // Separators of any kind become the one hyphen the name allows
        { in: '12/31', out: '12-31' },
        { in: '12 31', out: '12-31' },
        { in: '12.31', out: '12-31' },
        { in: '12--31', out: '12-31' },

        // Letters are dropped outright rather than replaced, so a month name
        // takes its separator with it and leaves only the day
        { in: 'Dec 31', out: '31' },
        { in: 'december-31', out: '31' },
        // and letters between digits leave the digits fused, rather than
        // separated by the hyphen every other invalid character becomes
        { in: '12dec31', out: '1231' },

        // A leading separator is removed; a trailing one is left for the
        // validator to reject, so that typing a hyphen mid-name is possible
        { in: '-12-31', out: '12-31' },
        { in: '12-31-', out: '12-31-' },

        { in: '', out: '' },
    ])('[$in] sanitizes to [$out]', ({ in: albumName, out }) => {
        expect(sanitizeDayAlbumName(albumName)).toBe(out);
    });
});

describe(validMediaExtensionsString, () => {
    // Shown to admins when an upload is rejected, so it is pinned as the exact
    // user-facing string. Adding an extension is meant to fail this test: the
    // message changes, and someone should see how it reads.
    it('lists every supported extension, dotted and comma-separated', () => {
        expect(validMediaExtensionsString()).toBe(
            '.jpg, .jpeg, .png, .gif, .heic, .heif, .mp4, .mov, .avi, .mkv, .webm, .m4v, .3gp, .mpg, .mpeg',
        );
    });
});
