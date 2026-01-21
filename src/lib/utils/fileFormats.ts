/**
 * File format handler registry.
 *
 * This module centralizes all knowledge about how to handle different file formats.
 * For example, HEIC files are converted to JPG by the backend.
 *
 * This provides a single source of truth for:
 * - Which files get renamed on the server and how
 * - Which files can't be validated in the browser
 */

import { VIDEO_EXTENSIONS } from './galleryPathUtils';

const heicHandler: FileFormatHandler = {
    extensions: ['heic', 'heif'],
    getMediaPath: (uploadPath) => uploadPath.replace(/\.(heic|heif)$/i, '.jpg'),
    browserCanDisplay: false,
};

const videoHandler: FileFormatHandler = {
    extensions: VIDEO_EXTENSIONS,
    getMediaPath: (uploadPath) => uploadPath, // No rename
    browserCanDisplay: false, // Can't validate in <img>
    processingTimeoutMs: 180000, // 3 minutes for video transcoding
};

const handlers: FileFormatHandler[] = [heicHandler, videoHandler];

/**
 * Defines how to handle a specific file format.
 * Each handler knows whether it applies to a file, how the server will rename it,
 * and whether browsers can validate it.
 */
type FileFormatHandler = {
    /**
     * File extensions this handler applies to (without dots, lowercase)
     */
    extensions: string[];

    /**
     * Given an upload path, returns the expected mediaPath in the album, after server processing
     */
    getMediaPath: (uploadPath: string) => string;

    /**
     * Whether browsers can natively display this format (false for HEIC/videos, true for JPG/PNG)
     */
    browserCanDisplay: boolean;

    /**
     * Custom timeout for processing (videos take longer than images)
     */
    processingTimeoutMs?: number;
};

/** Returns true if the filename ends with one of the given extensions */
function hasExtension(fileName: string, extensions: string[]): boolean {
    const extPattern = extensions.join('|');
    const regex = new RegExp(`\\.(${extPattern})$`, 'i');
    return regex.test(fileName);
}

/** Get handler for a file, if any applies */
export function getHandler(fileName: string): FileFormatHandler | undefined {
    return handlers.find((h) => hasExtension(fileName, h.extensions));
}

/** Get the expected final mediaPath in the album after the server changes the file format */
export function getMediaPath(uploadPath: string): string {
    const fileName = uploadPath.split('/').pop() ?? '';
    const handler = getHandler(fileName);
    return handler ? handler.getMediaPath(uploadPath) : uploadPath;
}

/** Does the server rename this file (e.g., HEIC → JPG)? */
export function isRenamedOnServer(uploadPath: string): boolean {
    return getMediaPath(uploadPath) !== uploadPath;
}

/**
 * Can browsers natively display this file format?
 * @param fileNameOrPath Accepts filename or full path.
 * @returns true for JPG/PNG, false for HEIC/videos
 */
export function browserCanDisplay(fileNameOrPath: string): boolean {
    const fileName = fileNameOrPath.split('/').pop() ?? '';
    return getHandler(fileName)?.browserCanDisplay ?? true;
}

/**
 * Get the processing timeout for a file format.
 * Videos take longer to process than images.
 * @param fileNameOrPath Accepts filename or full path.
 */
export function getProcessingTimeout(fileNameOrPath: string): number {
    const fileName = fileNameOrPath.split('/').pop() ?? '';
    const handler = getHandler(fileName);
    return handler?.processingTimeoutMs ?? DEFAULT_PROCESSING_TIMEOUT_MS;
}

/** Default processing timeout for images (15 seconds) */
const DEFAULT_PROCESSING_TIMEOUT_MS = 15000;
