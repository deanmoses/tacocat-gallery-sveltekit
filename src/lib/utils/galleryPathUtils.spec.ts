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
    VIDEO_EXTENSIONS,
    albumPathToDate,
    getParentAndNameFromPath,
    getParentFromPath,
    getNameFromPath,
} from './galleryPathUtils';

/** Every extension the gallery accepts, in the order the module lists them */
const MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];

describe(hasValidMediaExtension, () => {
    // Derived from the extension lists, so an extension added to either one is
    // held to this contract rather than being accepted untested
    it.each(MEDIA_EXTENSIONS)('accepts .%s', (ext) => {
        expect(hasValidMediaExtension(`photo.${ext}`)).toBe(true);
    });

    it.each(MEDIA_EXTENSIONS)('accepts .%s spelled in upper case', (ext) => {
        expect(hasValidMediaExtension(`photo.${ext.toUpperCase()}`)).toBe(true);
    });

    it.each([
        // Formats the gallery does not take, including one it plausibly might
        'photo.txt',
        'photo.pdf',
        'photo.webp',
        // An extension is not a filename: something has to precede the dot
        '.jpg',
        '.png',
        '.heic',
        // A supported extension has to be the last one
        'photo.jpg.txt',
        // and has to be an extension at all
        'photo',
        'jpg',
        '',
    ])('rejects %s', (fileName) => {
        expect(hasValidMediaExtension(fileName)).toBe(false);
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

    // Media, which lives only in day albums. Every supported extension is
    // exercised, derived from the lists rather than spelled out, so a new one
    // cannot be added to a format list and left out of path validation.
    ...MEDIA_EXTENSIONS.map((ext) => pathCase(`/2001/12-31/media.${ext}`, { isPath: true, isMedia: true })),
    ...MEDIA_EXTENSIONS.map((ext) =>
        pathCase(`/2001/12-31/media.${ext.toUpperCase()}`, { isPath: true, isMedia: true }),
    ),
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

/**
 * The two sanitizers are the same transformation seen at two scopes:
 * sanitizeMediaFilename splits off the extension and hands the stem to
 * sanitizeMediaNameWithoutExtension. They are tabled separately because they
 * deliberately disagree on one point -- a trailing underscore, which the stem
 * keeps and a whole filename does not -- and a shared table would have to
 * carry that exception in every row.
 */
describe(sanitizeMediaNameWithoutExtension, () => {
    it.each([
        // Already-valid names survive untouched
        { in: 'photo', out: 'photo' },
        { in: 'my_photo_1', out: 'my_photo_1' },
        { in: '123', out: '123' },

        { in: 'PHOTO', out: 'photo' },

        // Anything outside [a-z0-9_] becomes an underscore, and a run of them
        // collapses to one
        { in: 'my photo', out: 'my_photo' },
        { in: 'my-photo', out: 'my_photo' },
        { in: 'my  photo', out: 'my_photo' },
        { in: 'my___photo', out: 'my_photo' },
        { in: 'my - photo', out: 'my_photo' },
        { in: "photo's", out: 'photo_s' },
        { in: 'photo@home', out: 'photo_home' },

        { in: '_photo', out: 'photo' },
        { in: '__photo', out: 'photo' },
        { in: '-photo', out: 'photo' },

        // A trailing underscore is kept, unlike in a full filename, so that
        // typing an underscore part-way through a name is possible. The strict
        // validator rejects it on submit.
        { in: 'photo_', out: 'photo_' },
        { in: 'photo-', out: 'photo_' },

        { in: '', out: '' },
    ])('[$in] sanitizes to [$out]', ({ in: name, out }) => {
        expect(sanitizeMediaNameWithoutExtension(name)).toBe(out);
    });
});

describe(sanitizeMediaFilename, () => {
    it.each([
        // Already-valid names survive untouched
        { in: 'photo.jpg', out: 'photo.jpg' },
        { in: 'my_photo_1.jpg', out: 'my_photo_1.jpg' },

        // The name and the extension are both lowercased
        { in: 'IMAGE.JPG', out: 'image.jpg' },
        { in: 'Photo.PNG', out: 'photo.png' },
        { in: 'photo.GIF', out: 'photo.gif' },

        // jpeg is spelled jpg
        { in: 'photo.jpeg', out: 'photo.jpg' },
        { in: 'PHOTO.JPEG', out: 'photo.jpg' },

        // Invalid characters become underscores, and runs collapse
        { in: 'my photo.jpg', out: 'my_photo.jpg' },
        { in: 'my  photo.jpg', out: 'my_photo.jpg' },
        { in: 'my-photo.jpg', out: 'my_photo.jpg' },
        { in: 'my--photo.jpg', out: 'my_photo.jpg' },
        { in: 'my___photo.jpg', out: 'my_photo.jpg' },
        { in: 'my - photo.jpg', out: 'my_photo.jpg' },
        { in: 'photo@home.jpg', out: 'photo_home.jpg' },
        { in: 'photo#1.jpg', out: 'photo_1.jpg' },
        { in: 'photo (1).jpg', out: 'photo_1.jpg' },
        { in: "photo's.jpg", out: 'photo_s.jpg' },

        // Underscores at either end of the name are removed. The trailing one
        // is the point of difference from sanitizeMediaNameWithoutExtension.
        { in: '_photo.jpg', out: 'photo.jpg' },
        { in: '__photo.jpg', out: 'photo.jpg' },
        { in: '-photo.jpg', out: 'photo.jpg' },
        { in: 'photo_.jpg', out: 'photo.jpg' },
        { in: 'photo__.jpg', out: 'photo.jpg' },
        { in: 'photo-.jpg', out: 'photo.jpg' },

        { in: 'photo123.jpg', out: 'photo123.jpg' },
        { in: '123photo.jpg', out: '123photo.jpg' },

        // Only the last dot separates the extension, so earlier ones are
        // sanitized as part of the name
        { in: 'Screenshot 2024-01-15 at 10.30.45 AM.png', out: 'screenshot_2024_01_15_at_10_30_45_am.png' },
        { in: 'IMG_1234.JPG', out: 'img_1234.jpg' },
        { in: 'DSC_0001.jpeg', out: 'dsc_0001.jpg' },
        { in: 'Photo 2024-01-15.jpg', out: 'photo_2024_01_15.jpg' },

        { in: '', out: '' },
    ])('[$in] sanitizes to [$out]', ({ in: filename, out }) => {
        expect(sanitizeMediaFilename(filename)).toBe(out);
    });
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

describe(isValidMediaNameWithoutExtensionStrict, () => {
    it.each([
        // Lower-case alphanumerics, with single underscores between them
        { name: 'photo', valid: true },
        { name: 'photo1', valid: true },
        { name: '1photo', valid: true },
        { name: '123', valid: true },
        { name: 'a', valid: true },
        { name: '1', valid: true },
        { name: 'my_photo', valid: true },
        { name: 'my_photo_1', valid: true },
        { name: 'a_b_c_d', valid: true },
        { name: 'photo_1_2_3', valid: true },
        { name: '1_2', valid: true },

        // An underscore has to separate two things, so it cannot double up or
        // sit at either end
        { name: 'a__b', valid: false },
        { name: 'photo__1', valid: false },
        { name: 'a___b', valid: false },
        { name: '_photo', valid: false },
        { name: '__photo', valid: false },
        { name: 'photo_', valid: false },
        { name: 'photo__', valid: false },
        { name: '_', valid: false },
        { name: '__', valid: false },
        { name: '_photo_', valid: false },

        // Everything sanitizeMediaNameWithoutExtension would have removed
        { name: 'Photo', valid: false },
        { name: 'PHOTO', valid: false },
        { name: 'myPhoto', valid: false },
        { name: 'my-photo', valid: false },
        { name: 'photo-1', valid: false },
        { name: 'my photo', valid: false },
        { name: 'photo@1', valid: false },

        // The name is the part before the extension, so it carries no dot
        { name: 'photo.jpg', valid: false },

        { name: '', valid: false },
    ])('[$name]: $valid', ({ name, valid }) => {
        expect(isValidMediaNameWithoutExtensionStrict(name)).toBe(valid);
    });

    /**
     * A timing assertion, not a correctness one. The pattern this replaced --
     * /^[a-z0-9]+([a-z0-9_]*[a-z0-9]+)*$/ -- nests quantifiers over overlapping
     * character classes, so a name that fails only at its last character makes
     * it backtrack catastrophically. This exact input hangs it for over two
     * minutes; the current pattern separates the classes and returns at once.
     *
     * The timeout is generous next to a hang of that size, so it distinguishes
     * the two without being able to fail on a loaded machine.
     */
    it('rejects a long underscored name promptly rather than backtracking over it', () => {
        expect(isValidMediaNameWithoutExtensionStrict('monkey_river_15_howler_monkey_calling')).toBe(true);
        expect(isValidMediaNameWithoutExtensionStrict('monkey_river_15_howler_monkey_calling_')).toBe(false);
    }, 1000);
});

/**
 * getParentFromPath and getNameFromPath are the two halves of
 * getParentAndNameFromPath, so all three answer one table. Given separate
 * examples they drifted: trimming and the empty-path error were asserted only
 * against the combined function, and would have gone on passing if either half
 * had stopped delegating.
 */
type SplitCase = { path: string; parent: string; name: string };

const SPLIT_CASES: SplitCase[] = [
    { path: '/2001/12-31/image.jpg', parent: '/2001/12-31/', name: 'image.jpg' },
    { path: '/2001/12-31/video.mp4', parent: '/2001/12-31/', name: 'video.mp4' },
    { path: '/2001/12-31/', parent: '/2001/', name: '12-31' },
    { path: '/2001/', parent: '/', name: '2001' },
    // The root album has no parent and no name. Both are empty rather than
    // undefined, which the module's own docs flag as questionable.
    { path: '/', parent: '', name: '' },
    // Surrounding whitespace is trimmed before the path is judged
    { path: '  /2001/12-31/  ', parent: '/2001/', name: '12-31' },
];

/** Paths the splitters refuse, and what they say about them */
const INVALID_SPLIT_CASES = [
    // Album paths are only valid with a trailing slash, so these throw rather
    // than being read as /2001/12-31/ and /2001/
    { path: '/2001/12-31', error: 'Invalid path: [/2001/12-31]' },
    { path: '/2001', error: 'Invalid path: [/2001]' },
    { path: 'nonsense', error: 'Invalid path: [nonsense]' },
    { path: '/2001/13-01/', error: 'Invalid path: [/2001/13-01/]' },
    { path: '/2001/image.jpg', error: 'Invalid path: [/2001/image.jpg]' },
    // An empty path is called out separately, since there is no path to name
    { path: '', error: 'Invalid path: cannot be empty' },
    { path: '   ', error: 'Invalid path: cannot be empty' },
];

describe(getParentAndNameFromPath, () => {
    it.each(SPLIT_CASES)('[$path] splits into [$parent] and [$name]', ({ path, parent, name }) => {
        expect(getParentAndNameFromPath(path)).toStrictEqual({ parent, name });
    });

    it.each(INVALID_SPLIT_CASES)('refuses [$path]', ({ path, error }) => {
        expect(() => getParentAndNameFromPath(path)).toThrow(error);
    });
});

describe(getParentFromPath, () => {
    it.each(SPLIT_CASES)('[$path] has parent [$parent]', ({ path, parent }) => {
        expect(getParentFromPath(path)).toBe(parent);
    });

    it.each(INVALID_SPLIT_CASES)('refuses [$path]', ({ path, error }) => {
        expect(() => getParentFromPath(path)).toThrow(error);
    });
});

describe(getNameFromPath, () => {
    it.each(SPLIT_CASES)('[$path] has name [$name]', ({ path, name }) => {
        expect(getNameFromPath(path)).toBe(name);
    });

    it.each(INVALID_SPLIT_CASES)('refuses [$path]', ({ path, error }) => {
        expect(() => getNameFromPath(path)).toThrow(error);
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

/**
 * A drag-and-drop can hand the same filename over twice, and two files cannot
 * share a path. The renamed one takes the lowest free suffix, which means
 * looking at the whole batch: a name a suffix would collide with may not have
 * been reached yet.
 */
describe(deduplicateMediaPaths, () => {
    it.each([
        { description: 'nothing to do', in: [], out: [] },
        {
            description: 'no duplicates',
            in: ['/2024/01-01/a.jpg', '/2024/01-01/b.jpg'],
            out: ['/2024/01-01/a.jpg', '/2024/01-01/b.jpg'],
        },

        // The first occurrence keeps the name; the rest are numbered from _2
        {
            description: 'one duplicate',
            in: ['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg'],
            out: ['/2024/01-01/photo.jpg', '/2024/01-01/photo_2.jpg'],
        },
        {
            description: 'two duplicates',
            in: ['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg'],
            out: ['/2024/01-01/photo.jpg', '/2024/01-01/photo_2.jpg', '/2024/01-01/photo_3.jpg'],
        },
        {
            description: 'two names duplicated independently',
            in: ['/2024/01-01/a.jpg', '/2024/01-01/b.jpg', '/2024/01-01/a.jpg', '/2024/01-01/b.jpg'],
            out: ['/2024/01-01/a.jpg', '/2024/01-01/b.jpg', '/2024/01-01/a_2.jpg', '/2024/01-01/b_2.jpg'],
        },

        // The suffix goes before the extension, whatever the extension is
        {
            description: 'duplicate png',
            in: ['/2024/01-01/photo.png', '/2024/01-01/photo.png'],
            out: ['/2024/01-01/photo.png', '/2024/01-01/photo_2.png'],
        },
        {
            description: 'duplicate video',
            in: ['/2024/01-01/clip.mp4', '/2024/01-01/clip.mp4'],
            out: ['/2024/01-01/clip.mp4', '/2024/01-01/clip_2.mp4'],
        },
        // Paths collide, not names: the same stem under two extensions is two
        // different files
        {
            description: 'same name, different extensions',
            in: ['/2024/01-01/photo.jpg', '/2024/01-01/photo.png'],
            out: ['/2024/01-01/photo.jpg', '/2024/01-01/photo.png'],
        },
        // and the same name in two albums likewise
        {
            description: 'same name in two day albums',
            in: ['/2024/01-01/photo.jpg', '/2024/01-02/photo.jpg'],
            out: ['/2024/01-01/photo.jpg', '/2024/01-02/photo.jpg'],
        },

        // A suffix skips any name the batch already contains, whether that name
        // arrives before or after the duplicate that would have taken it
        {
            description: 'the name a suffix wants is later in the batch',
            in: ['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo_2.jpg'],
            out: ['/2024/01-01/photo.jpg', '/2024/01-01/photo_3.jpg', '/2024/01-01/photo_2.jpg'],
        },
        {
            description: 'the name a suffix wants is earlier in the batch',
            in: ['/2024/01-01/photo_2.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg'],
            out: ['/2024/01-01/photo_2.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo_3.jpg'],
        },
        {
            description: 'two suffixes in a row are already taken',
            in: [
                '/2024/01-01/photo.jpg',
                '/2024/01-01/photo.jpg',
                '/2024/01-01/photo_2.jpg',
                '/2024/01-01/photo_3.jpg',
            ],
            out: [
                '/2024/01-01/photo.jpg',
                '/2024/01-01/photo_4.jpg',
                '/2024/01-01/photo_2.jpg',
                '/2024/01-01/photo_3.jpg',
            ],
        },
    ])('$description', ({ in: mediaPaths, out }) => {
        expect(deduplicateMediaPaths(mediaPaths)).toStrictEqual(out);
    });

    it('returns a result of the same length as its input', () => {
        const mediaPaths = ['/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg', '/2024/01-01/photo.jpg'];

        expect(deduplicateMediaPaths(mediaPaths)).toHaveLength(mediaPaths.length);
    });

    it('produces no duplicate paths, whatever it was given', () => {
        const mediaPaths = [
            '/2024/01-01/photo.jpg',
            '/2024/01-01/photo.jpg',
            '/2024/01-01/photo_2.jpg',
            '/2024/01-01/photo_2.jpg',
            '/2024/01-01/photo.jpg',
        ];

        const result = deduplicateMediaPaths(mediaPaths);

        expect(new Set(result).size).toBe(mediaPaths.length);
    });
});
