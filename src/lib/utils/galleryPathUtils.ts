/** Supported image extensions */
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'heic', 'heif'];

/** Supported video extensions */
export const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', '3gp', 'mpg', 'mpeg'];

/**
 * Return true if filename ends with a supported media (image or video) extension
 */
export function hasValidMediaExtension(fileName: string): boolean {
    const extPattern = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].join('|');
    const regex = new RegExp(`^.+\\.(${extPattern})$`, 'i');
    return regex.test(fileName);
}

/**
 * Return string of all valid media extensions, something like ".jpg, .jpeg, .png, .gif, .mov, .avi"
 */
export function validMediaExtensionsString(): string {
    return [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].map((ext) => `.${ext}`).join(', ');
}

/**
 * Return true if specified string is a valid album, image, or video path
 * like / or /2001/ or /2001/12-31/ or /2001/12-31/image.jpg or /2001/12-31/video.mp4
 */
export function isValidPath(path: string): boolean {
    return isValidAlbumPath(path) || isValidMediaPath(path);
}

/**
 * Return true if specified string is a valid media path (image or video)
 * like /2001/12-31/image.jpg or /2001/12-31/video.mp4.
 *
 * Cannot be on root album like /image.jpg
 * Cannot be on year album like /2001/image.jpg
 * Must be on a day album like /2001/12-31/image.jpg
 */
export function isValidMediaPath(path: string): boolean {
    const extPattern = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].join('|');
    const regex = new RegExp(
        `^/\\d\\d\\d\\d/(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])/[a-zA-Z0-9_-]+\\.(${extPattern})$`,
        'i',
    );
    return regex.test(path);
}

/**
 * Return true if specified string is a valid album path
 * like / or /2001/ or /2001/12-31/
 */
export function isValidAlbumPath(path: string): boolean {
    return /^(\/\d\d\d\d(\/(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))?)?\/$/.test(path);
}

/**
 * Return true if specified string is a valid year album path like /2001/
 */
export function isValidYearAlbumPath(path: string): boolean {
    return /^\/\d\d\d\d\/$/.test(path);
}

/**
 * Return true if specified string is a valid day album path like /2001/12-31/
 */
export function isValidDayAlbumPath(path: string): boolean {
    return /^\/\d\d\d\d\/(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\/$/i.test(path);
}

/**
 * Return true if specified string is a strictly valid media filename.
 * Must be lower case
 * No hyphens (-) just underscores (_)
 * Must not have a path.
 */
export function isValidMediaNameWithoutExtensionStrict(filename: string): boolean {
    return /^[a-z0-9]+([a-z0-9_]*[a-z0-9]+)*$/.test(filename);
}

/**
 * Return sanitized version of the specified extensionless media filename.
 *
 * @param name media filename without extension like some-image (no .jpg)
 */
export function sanitizeMediaNameWithoutExtension(name: string): string {
    return (name || '')
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_') // any invalid chars to _
        .replace(/_+/g, '_') // multiple _ to _
        .replace(/^_/, '') // remove leading underscore
        .replace(/_$/, ''); // remove trailing underscore
}

/**
 * Return sanitized extension: lowercase, jpeg -> jpg
 */
function sanitizeMediaExtension(ext: string): string {
    return (ext || '').toLowerCase().replace(/^jpeg$/, 'jpg');
}

/**
 * Return sanitized version of the specified media filename.
 *  - IMAGE.JPG -> image.jpg
 *  - image-1.jpg -> image_1.jpg
 *  - image 1.jpg -> image_1.jpg
 * Does not check whether it's a valid media name for the gallery.
 *
 * @param filename filename like some-image.jpg
 */
export function sanitizeMediaFilename(filename: string): string {
    if (!filename) return '';
    const dotIndex = filename.lastIndexOf('.');
    if (dotIndex === -1) return sanitizeMediaNameWithoutExtension(filename);
    const name = sanitizeMediaNameWithoutExtension(filename.slice(0, dotIndex));
    const ext = sanitizeMediaExtension(filename.slice(dotIndex + 1));
    return `${name}.${ext}`;
}

export function sanitizeDayAlbumName(albumName: string): string {
    return (albumName || '')
        .replace(/[a-zA-Z]+/g, '') // letters to nothing
        .replace(/[^0-9-]+/g, '-') // any other invalid chars to -
        .replace(/-+/g, '-') // multple - to single -
        .replace(/^-/g, ''); // remove leading -
}

/**
 * Return the specified path's parent path and leaf item
 *  - /2001/12-31/image.jpg returns  '/2001/12-31/' and 'image.jpg'
 *  - /2001/12-31 returns '/2001/' and '12-31'
 *  - /2001 returns '/' and 2000'
 *  - / returns  '' and undefined
 *
 *  @param {String} path a path of the format /2001/12-31/image.jpg, or a subset thereof
 */
export function getParentAndNameFromPath(path: string) {
    if (!path) throw new Error('Invalid path: cannot be empty');
    path = path.toString().trim();
    if (!path) throw new Error('Invalid path: cannot be empty');
    if (!isValidPath(path)) throw new Error(`Invalid path: [${path}]`);
    if (path === '/') return { parent: '', name: '' };
    const pathParts = path.split('/'); // split the path apart
    if (!pathParts[pathParts.length - 1]) pathParts.pop(); // if the path ended in a "/", remove the blank path part at the end
    const name = pathParts.pop(); // remove leaf of path
    path = pathParts.join('/');
    if (path.substr(-1) !== '/') path = path + '/'; // make sure path ends with a "/"
    if (path.lastIndexOf('/', 0) !== 0) path = '/' + path; // make sure path starts with a "/"
    return {
        parent: path,
        name: name,
    };
}

/**
 * For the given path, return the parent path
 *
 * For example:
 *  - /2001/12-31/image.jpg returns  /2001/12-31/
 *  - /2001/12-31 returns /2001/
 *  - /2001 returns /
 *  - / returns  '' TODO: MAYBE THIS SHOULD BE UNDEFINED
 *
 * @param {String} path a path of the format /2001/12-31/image.jpg, or a subset thereof
 * @returns {String} parent path
 */
export function getParentFromPath(path: string): string {
    return getParentAndNameFromPath(path).parent;
}

/**
 * For the given path, return the leaf name
 *
 * For example:
 *  - /2001/12-31/image.jpg returns image.jpg
 *  - /2001/12-31 returns 12-31
 *  - /2001 returns 2001
 *  - / returns  ''
 *
 * @param path a path of the format /2001/12-31/image.jpg, or a subset thereof
 * @returns name of leaf, like image.jpg
 */
export function getNameFromPath(path: string): string | undefined {
    return getParentAndNameFromPath(path).name;
}

/**
 * Convert from an album path to a date.
 *
 * @param albumPath path of root, year or day album like / or /2001/ or /2001/12-31/
 */
export function albumPathToDate(albumPath: string): Date {
    if (!isValidAlbumPath(albumPath)) throw new Error(`Invalid album path: [${albumPath}]`);
    if (albumPath === '/') {
        return new Date(1826, 0, 1); // Date of first surviving photograph
    }
    const m = /^\/(?<year>\d\d\d\d)\/((?<month>\d\d)-(?<day>\d\d)\/)?$/i.exec(albumPath);
    if (!m?.groups?.year) throw new Error(`Error matching`);
    const year = Number.parseInt(m.groups.year, 10);
    if (!!m?.groups?.month && !!m?.groups?.day) {
        const month = Number.parseInt(m.groups.month, 10) - 1;
        const day = Number.parseInt(m.groups.day, 10);
        return new Date(year, month, day);
    }
    return new Date(year, 0, 1); // Use Jan 1 for year albums
}

/**
 * De-duplicate media paths by appending _2, _3, etc. to duplicates.
 * Preserves the order of the original array.
 *
 * @param mediaPaths array of media paths like /2024/01-01/photo.jpg
 * @returns array with duplicates renamed
 */
export function deduplicateMediaPaths(mediaPaths: string[]): string[] {
    const used = new Set<string>(); // All paths that are used (original or generated)
    const result: string[] = [];

    // First pass: mark all original paths as potentially used
    for (const path of mediaPaths) {
        used.add(path);
    }

    // Track how many times we've seen each original path
    const seenCount = new Map<string, number>();

    for (const path of mediaPaths) {
        const count = seenCount.get(path) || 0;
        seenCount.set(path, count + 1);

        if (count === 0) {
            // First occurrence - use as-is
            result.push(path);
        } else {
            // Duplicate - find next available suffix
            const dotIndex = path.lastIndexOf('.');
            const base = path.slice(0, dotIndex);
            const ext = path.slice(dotIndex);

            let suffix = count + 1;
            let newPath = `${base}_${suffix}${ext}`;
            while (used.has(newPath)) {
                suffix++;
                newPath = `${base}_${suffix}${ext}`;
            }
            used.add(newPath);
            result.push(newPath);
        }
    }

    return result;
}
