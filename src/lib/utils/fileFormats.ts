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

/**
 * Defines how to handle a specific file format.
 * Each handler knows whether it applies to a file, how the server will rename it,
 * and whether browsers can validate it.
 */
export type FileFormatHandler = {
    /** Returns true if this handler applies to the given filename */
    appliesTo: (fileName: string) => boolean;
    /** Given an upload path, returns the expected imagePath in the album, after server processing */
    getImagePath: (uploadPath: string) => string;
    /** Whether browsers can natively display this format (false for HEIC, true for JPG/PNG) */
    browserCanDisplay: boolean;
};

const heicHandler: FileFormatHandler = {
    appliesTo: (fileName) => /\.(heic|heif)$/i.test(fileName),
    getImagePath: (uploadPath) => uploadPath.replace(/\.(heic|heif)$/i, '.jpg'),
    browserCanDisplay: false,
};

const handlers: FileFormatHandler[] = [heicHandler];

/** Get handler for a file, if any applies */
export function getHandler(fileName: string): FileFormatHandler | undefined {
    return handlers.find((h) => h.appliesTo(fileName));
}

/** Get the expected final imagePath in the album after the server changes the file format */
export function getImagePath(uploadPath: string): string {
    const fileName = uploadPath.split('/').pop() ?? '';
    const handler = getHandler(fileName);
    return handler ? handler.getImagePath(uploadPath) : uploadPath;
}

/** Does the server rename this file (e.g., HEIC → JPG)? */
export function isRenamedOnServer(uploadPath: string): boolean {
    return getImagePath(uploadPath) !== uploadPath;
}

/**
 * Can browsers natively display this file format?
 * @param fileNameOrPath Accepts filename or full path.
 * @returns true for JPG/PNG, false for HEIC
 */
export function browserCanDisplay(fileNameOrPath: string): boolean {
    const fileName = fileNameOrPath.split('/').pop() ?? '';
    return getHandler(fileName)?.browserCanDisplay ?? true;
}
