import { UploadState, type MediaItemToUpload, type UploadEntry } from '$lib/models/album';
import type { Album } from '$lib/models/GalleryItemInterfaces';
import { getMediaPath, isRenamedOnServer } from './fileFormats';

/**
 * For replacement uploads, returns the upload path to use.
 * Preserves the base name from the target but uses the extension from the dropped file,
 * so the backend's format conversion (e.g., HEIC→JPG) runs properly.
 */
export function getUploadPathForReplacement(targetPath: string, fileName: string): string {
    const targetExt = targetPath.split('.').pop()!.toLowerCase();
    const sourceExt = fileName.split('.').pop()!.toLowerCase();
    if (targetExt === sourceExt) {
        return targetPath;
    }
    // Replace target extension with source extension
    return targetPath.replace(/\.[^.]+$/, '.' + sourceExt);
}

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
 * 3. The album contains an image at the expected path after server processing
 *
 * For files that are renamed on server (e.g., HEIC → JPG), we check that the album has an image
 * at the expected path. For replacements, we also verify the versionId changed from the previous one.
 * For non-renamed files, we match versionId exactly.
 *
 * @param uploads - The list of upload entries to check
 * @param getImageVersionId - Function to get the versionId of an image in the album (returns undefined if not found)
 * @returns Object containing array of processed uploadPaths and whether all are done
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

        const albumVersionId = getImageVersionId(upload.mediaPath);
        const isComplete = isUploadComplete(upload, albumVersionId);

        if (isComplete) {
            processed.push(upload.uploadPath);
        } else {
            console.log(`Did not find file [${upload.mediaPath}] in the album, it must still be processing`);
            allProcessed = false;
        }
    }
    if (allProcessed) {
        console.log(`Found all uploaded files in the album, processing complete!`);
    }
    return { processed, allProcessed };
}

/**
 * Determines if a single upload is complete based on the album's current state.
 */
function isUploadComplete(upload: UploadEntry, albumVersionId: string | undefined): boolean {
    if (isRenamedOnServer(upload.uploadPath)) {
        // File is renamed on server (e.g., HEIC → JPG), so versionId will differ from upload
        if (upload.previousVersionId) {
            // Replacement: wait for versionId to change from the previous one
            return albumVersionId !== undefined && albumVersionId !== upload.previousVersionId;
        } else {
            // New upload: just needs to exist in album
            return albumVersionId !== undefined;
        }
    } else {
        // File keeps same name, so versionId should match exactly
        return albumVersionId === upload.versionId;
    }
}

/**
 * Check which files already exist in the album.
 * For colliding files, sets previousVersionId so upload completion detection works correctly.
 * @param files - Files to check for collisions
 * @param album - The album to check against (if undefined, returns empty array)
 * @returns Names of colliding files (for display in confirmation dialog)
 */
export function enrichWithPreviousVersionIds(files: MediaItemToUpload[], album: Album | undefined): string[] {
    const collidingNames: string[] = [];
    if (!album || !album.media?.length) return collidingNames;
    for (const file of files) {
        // Check both upload path and final path (e.g., HEIC→JPG conversion)
        const mediaPath = getMediaPath(file.uploadPath);
        const media = album.getMedia(file.uploadPath) ?? album.getMedia(mediaPath);
        if (media) {
            console.log(`File [${file.uploadPath}] is already in album [${album.path}]`);
            collidingNames.push(file.file.name);
            // Set previousVersionId so upload completion detection works for replacements
            file.previousVersionId = media.versionId;
        }
    }
    return collidingNames;
}
