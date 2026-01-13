import type { ImageToUpload } from '$lib/models/album';

/** Result of validating a batch of files */
export type ImageValidationResult = {
    valid: ImageToUpload[];
    invalid: string[]; // imagePaths that failed validation
};

/**
 * Validates that files are loadable images.
 * Checks file size > 0 and attempts to load via Image element.
 *
 * @param files Files to validate (already filtered by extension)
 * @returns Valid files and list of invalid filenames
 */
export async function validateImageBatch(files: ImageToUpload[]): Promise<ImageValidationResult> {
    const results = await Promise.all(files.map((file) => validateSingleImage(file)));

    const valid: ImageToUpload[] = [];
    const invalid: string[] = [];

    for (let i = 0; i < files.length; i++) {
        if (results[i]) {
            valid.push(files[i]);
        } else {
            invalid.push(files[i].imagePath);
        }
    }

    return { valid, invalid };
}

/**
 * Returns true if the file has a HEIC/HEIF extension.
 * These formats aren't supported by most browsers' Image element,
 * so we skip content validation for them.
 */
function isHeicFile(fileName: string): boolean {
    return /\.(heic|heif)$/i.test(fileName);
}

/**
 * Validates a single file by attempting to load it as an image.
 * Creates a temporary object URL, attempts load, then revokes the URL.
 * HEIC/HEIF files skip browser Image validation since most browsers can't load them.
 *
 * @returns true if valid, false if invalid
 */
async function validateSingleImage(imageToUpload: ImageToUpload): Promise<boolean> {
    const file = imageToUpload.file;

    // Check for empty file
    if (file.size === 0) {
        return false;
    }

    // HEIC/HEIF files can't be loaded by most browsers' Image element,
    // so skip content validation for them (backend will handle conversion)
    if (isHeicFile(file.name)) {
        return true;
    }

    // Attempt to load as image
    const url = URL.createObjectURL(file);
    try {
        return await loadImage(url);
    } finally {
        URL.revokeObjectURL(url);
    }
}

/**
 * Attempts to load an image from a URL.
 *
 * @returns true if image loads successfully, false otherwise
 */
function loadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

/**
 * Creates an object URL for an image file.
 * For HEIC/HEIF files, tests if the browser can display them first.
 * Returns empty string if the browser can't display the file.
 */
export async function createPreviewUrl(file: File): Promise<string> {
    const url = URL.createObjectURL(file);

    // Non-HEIC files can be displayed by all browsers
    if (!isHeicFile(file.name)) {
        return url;
    }

    // Test if browser can load this HEIC file
    const canLoad = await loadImage(url);
    if (canLoad) {
        return url;
    }

    // Browser can't display HEIC, clean up and return empty
    URL.revokeObjectURL(url);
    return '';
}
