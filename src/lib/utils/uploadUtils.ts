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
        // Skip checking uploads that are not yet in the processing state,
        // which means they have not yet been uploaded to S3, which means
        // they don't yet have a version (the versionId check is redundant)
        if (upload.status !== UploadState.PROCESSING || !upload.versionId) {
            allProcessed = false;
            continue;
        }
        const albumVersionId = getImageVersionId(upload.imagePath);
        if (albumVersionId && albumVersionId === upload.versionId) {
            // Found image. Mark as processed.
            processed.push(upload.imagePath);
        } else {
            console.log(
                `Did not find file [${upload.imagePath}] version [${upload.versionId}] in the album, it must still be processing`,
            );
            allProcessed = false;
        }
    }
    if (allProcessed) {
        console.log(`Found all uploaded files in the album, processing complete!`);
    }
    return { processed, allProcessed };
}
