import { UploadState, type UploadEntry } from '$lib/models/album';

/**
 * Result of checking which uploads have been processed by the server
 */
export type ProcessedUploadsResult = {
    /** Image paths that have been fully processed and are now in the album */
    processed: string[];
    /** Whether all uploads have been processed */
    allProcessed: boolean;
};

/**
 * Returns true if the file has a HEIC/HEIF extension.
 * The backend converts these to JPG, so we need to check for the converted path.
 */
function isHeicPath(imagePath: string): boolean {
    return /\.(heic|heif)$/i.test(imagePath);
}

/**
 * For HEIC/HEIF files, returns the expected JPG path after backend conversion.
 * For other files, returns undefined.
 */
export function getConvertedJpgPath(imagePath: string): string | undefined {
    if (!isHeicPath(imagePath)) {
        return undefined;
    }
    return imagePath.replace(/\.(heic|heif)$/i, '.jpg');
}

/**
 * Checks which uploads have been processed by comparing upload entries
 * against the current album state.
 *
 * An upload is considered processed when:
 * 1. It has status PROCESSING (meaning it was uploaded to S3)
 * 2. It has a versionId from S3
 * 3. The album contains an image at that path with a matching versionId
 *
 * @param uploads - The list of upload entries to check
 * @param getImageVersionId - Function to get the versionId of an image in the album (returns undefined if not found)
 * @returns Object containing array of processed image paths and whether all are done
 */
export function findProcessedUploads(
    uploads: UploadEntry[],
    getImageVersionId: (imagePath: string) => string | undefined,
): ProcessedUploadsResult {
    const processed: string[] = [];
    let allProcessed = true;

    for (const upload of uploads) {
        // Skip uploads not yet in PROCESSING state (still uploading to S3) or
        // missing versionId (defensive check - should always have versionId when PROCESSING)
        if (upload.status !== UploadState.PROCESSING || !upload.versionId) {
            allProcessed = false;
            continue;
        }

        // Check if the image is in the album with matching versionId
        const albumVersionId = getImageVersionId(upload.imagePath);

        if (albumVersionId && albumVersionId === upload.versionId) {
            // Found image with matching versionId. Mark as processed.
            processed.push(upload.imagePath);
            continue;
        }

        // For HEIC/HEIF files, check if the converted JPG exists in the album.
        // The converted JPG will have a different versionId than the original upload,
        // so we just check for existence rather than matching versionId.
        const convertedPath = getConvertedJpgPath(upload.imagePath);
        if (convertedPath) {
            const convertedVersionId = getImageVersionId(convertedPath);
            if (convertedVersionId) {
                // Found converted JPG. Mark as processed.
                processed.push(upload.imagePath);
                continue;
            }
        }

        console.log(
            `Did not find file [${upload.imagePath}] version [${upload.versionId}] in the album, it must still be processing`,
        );
        allProcessed = false;
    }
    if (allProcessed) {
        console.log(`Found all uploaded files in the album, processing complete!`);
    }
    return { processed, allProcessed };
}
