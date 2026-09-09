import { describe, it, expect } from 'vitest';
import { browserCanDisplay, getMediaPath, getProcessingTimeout, isRenamedOnServer } from './fileFormats';
import { VIDEO_EXTENSIONS } from './galleryPathUtils';

type FormatCase = {
    /** Path as uploaded, before the server processes it */
    uploadPath: string;
    /** Path the file will have in the album once the server is done with it */
    mediaPath: string;
    /** Whether the server stores the file under a different name than it arrived under */
    renamed: boolean;
    /** Whether a browser can render the uploaded bytes in an <img> */
    canDisplay: boolean;
    /** How long to wait for the server to finish processing */
    timeoutMs: number;
};

/** fileFormats' default, for files the server stores as it receives them */
const IMAGE_TIMEOUT_MS = 15000;

/** Longer than an image's, because the server transcodes video */
const VIDEO_TIMEOUT_MS = 180000;

/** Formats no handler claims, which therefore take the defaults */
const PASSTHROUGH_CASES: FormatCase[] = [
    '/2024/01-01/photo.jpg',
    '/2024/01-01/photo.jpeg',
    '/2024/01-01/photo.png',
    '/2024/01-01/photo.gif',
    // A handler matches on the extension alone, so a format name appearing
    // earlier in the filename must not trigger one
    '/2024/01-01/photo.heic.jpg',
    '/2024/01-01/photo.mp4.png',
    // Unknown and absent extensions fall through to the same defaults
    '/2024/01-01/notes.txt',
    '/2024/01-01/photo',
].map((path) => ({
    uploadPath: path,
    mediaPath: path,
    renamed: false,
    canDisplay: true,
    timeoutMs: IMAGE_TIMEOUT_MS,
}));

/** Formats the server converts to JPG, and that browsers cannot render as uploaded */
const HEIC_CASES: FormatCase[] = [
    { uploadPath: '/2024/01-01/photo.heic', mediaPath: '/2024/01-01/photo.jpg' },
    { uploadPath: '/2024/01-01/photo.heif', mediaPath: '/2024/01-01/photo.jpg' },
    // Cameras write the extension in either case; the rename always lands on .jpg
    { uploadPath: '/2024/01-01/photo.HEIC', mediaPath: '/2024/01-01/photo.jpg' },
    { uploadPath: '/2024/01-01/photo.HEIF', mediaPath: '/2024/01-01/photo.jpg' },
    // The rename replaces the last extension only, so a name that carries the
    // format twice keeps the first one
    { uploadPath: '/2024/01-01/photo.heic.heic', mediaPath: '/2024/01-01/photo.heic.jpg' },
].map((paths) => ({ ...paths, renamed: true, canDisplay: false, timeoutMs: IMAGE_TIMEOUT_MS }));

/**
 * Rows are derived from VIDEO_EXTENSIONS so an extension added there is
 * automatically held to the video handler's contract. The expectations are
 * spelled out rather than derived, so the test still fails if the handler
 * stops claiming the list.
 */
const VIDEO_CASES: FormatCase[] = [...VIDEO_EXTENSIONS, 'MP4', 'MOV'].map((ext) => ({
    uploadPath: `/2024/01-01/video.${ext}`,
    mediaPath: `/2024/01-01/video.${ext}`,
    renamed: false,
    canDisplay: false,
    timeoutMs: VIDEO_TIMEOUT_MS,
}));

const ALL_CASES: FormatCase[] = [...PASSTHROUGH_CASES, ...HEIC_CASES, ...VIDEO_CASES];

describe(getMediaPath, () => {
    it.each(ALL_CASES)('$uploadPath is stored as $mediaPath', ({ uploadPath, mediaPath }) => {
        expect(getMediaPath(uploadPath)).toBe(mediaPath);
    });
});

describe(isRenamedOnServer, () => {
    it.each(ALL_CASES)('$uploadPath renamed on server: $renamed', ({ uploadPath, renamed }) => {
        expect(isRenamedOnServer(uploadPath)).toBe(renamed);
    });
});

describe(browserCanDisplay, () => {
    it.each(ALL_CASES)('$uploadPath displayable in a browser: $canDisplay', ({ uploadPath, canDisplay }) => {
        expect(browserCanDisplay(uploadPath)).toBe(canDisplay);
    });

    // Documented to take either form, because callers hold a File in one place
    // and an album path in another
    it.each(['photo.jpg', 'photo.heic', 'video.mp4'])('answers the same for the bare filename %s', (fileName) => {
        expect(browserCanDisplay(fileName)).toBe(browserCanDisplay(`/2024/01-01/${fileName}`));
    });
});

describe(getProcessingTimeout, () => {
    it.each(ALL_CASES)('$uploadPath waits $timeoutMs ms for processing', ({ uploadPath, timeoutMs }) => {
        expect(getProcessingTimeout(uploadPath)).toBe(timeoutMs);
    });
});
