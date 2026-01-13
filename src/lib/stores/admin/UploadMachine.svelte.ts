import { toast } from '@zerodevx/svelte-toast';
import { UploadState, type ImageToUpload } from '$lib/models/album';
import { albumState, getUploadsForAlbum } from '../AlbumState.svelte';
import {
    sanitizeImageName,
    getParentFromPath,
    isValidImagePath,
    hasValidExtension,
    deduplicateImagePaths,
} from '$lib/utils/galleryPathUtils';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { findProcessedUploads } from '$lib/utils/uploadUtils';
import { validateImageBatch } from '$lib/utils/imageValidation';
import { uploadToS3, fetchPresignedUrls } from '$lib/utils/s3Upload';

/**
 * Image upload state machine
 */
class UploadMachine {
    //
    // STATE TRANSITION METHODS
    // These mutate the store's state.
    //
    // Characteristics:
    //  - These are the ONLY way to update this store's state.
    //    These should be the only public methods on this store.
    //  - These ONLY update state.
    //    If they have to do any work, like making a server call, they invoke it in an
    //    event-like fire-and-forget fashion, meaning invoke async methods *without* await.
    //  - These are synchronous.
    //    They expectation is that they return near-instantly.
    //  - These return void.
    //    To read this store's state, use one of the public $derived() fields
    //

    uploadImage(imagePath: string, file: File): void {
        this.#uploadImage(imagePath, file); // invoke async service in fire-and-forget fashion
    }

    uploadImages(albumPath: string, imagesToUpload: ImageToUpload[]): void {
        this.#uploadImages(albumPath, imagesToUpload); // invoke async service in fire-and-forget fashion
    }

    #uploadEnqueued(imagePath: string, file: File): void {
        albumState.uploads.push({
            file,
            imagePath,
            status: UploadState.UPLOAD_NOT_STARTED,
        });
    }

    #uploadStarted(imagePath: string): void {
        const upload = albumState.uploads.find((upload) => upload.imagePath === imagePath);
        if (!upload) {
            console.warn(`Upload not found for path: ${imagePath}`);
            return;
        }
        upload.status = UploadState.UPLOADING;
    }

    #uploadProcessing(imagePath: string, versionId: string): void {
        const upload = albumState.uploads.find((upload) => upload.imagePath === imagePath);
        if (!upload) {
            console.warn(`Upload not found for path: ${imagePath}`);
            return;
        }
        upload.status = UploadState.PROCESSING;
        upload.versionId = versionId;
    }

    #uploadErrored(imagePath: string, errorMessage: string): void {
        console.error(`Error uploading [${imagePath}]: ${errorMessage}`);
        toast.push(`Error uploading [${imagePath}]: ${errorMessage}`);
        this.#uploadComplete(imagePath);
    }

    #uploadSkipped(imagePath: string, skipMessage: string): void {
        console.error(`Skipping upload [${imagePath}]: ${skipMessage}`);
        toast.push(`Skipping upload [${imagePath}]: ${skipMessage}`);
    }

    #uploadComplete(imagePath: string): void {
        // remove upload from list
        albumState.uploads = albumState.uploads.filter((upload) => upload.imagePath !== imagePath);
    }

    //
    // SERVICE METHODS
    // These 'do work', like making a server call.
    //
    // Characteristics:
    //  - These are private, meant to only be called by STATE TRANSITION METHODS
    //  - These don't mutate state directly; rather, they call STATE TRANSITION METHODS to do it
    //  - These are generally async
    //  - These don't return values; they return void or Promise<void>
    //

    /**
     * Upload the specified single image.  Replaces image at the specified path, if it exists.
     *
     * @param file A File object from browser's file picker
     * @param imagePath image to replace
     */
    async #uploadImage(imagePath: string, file: File): Promise<void> {
        if (!file) return;
        try {
            const albumPath = getParentFromPath(imagePath);
            const imagesToUpload: ImageToUpload[] = [{ file, imagePath }];
            await this.#uploadImages(albumPath, imagesToUpload);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.#uploadErrored(imagePath, msg);
        }
    }

    async #uploadImages(albumPath: string, imagesToUpload: ImageToUpload[]): Promise<void> {
        try {
            if (!imagesToUpload || imagesToUpload.length === 0) throw new Error('No images to upload');

            // Validate file extensions and image paths
            imagesToUpload = imagesToUpload.filter((imageToUpload) => {
                if (!hasValidExtension(imageToUpload.file.name)) {
                    this.#uploadSkipped(imageToUpload.imagePath, `Invalid file type: [${imageToUpload.file.name}]`);
                    return false;
                }
                if (!isValidImagePath(imageToUpload.imagePath)) {
                    this.#uploadSkipped(imageToUpload.imagePath, `Invalid image path: [${imageToUpload.imagePath}]`);
                    return false;
                }
                return true;
            });
            if (imagesToUpload.length === 0) return;

            // Validate image content (checks file size > 0 and that browser can load the image)
            const validationResult = await validateImageBatch(imagesToUpload);
            for (const imagePath of validationResult.invalid) {
                this.#uploadSkipped(imagePath, 'Invalid or corrupted image file');
            }
            imagesToUpload = validationResult.valid;
            if (imagesToUpload.length === 0) return;

            // Get presigned URLs
            const imagePaths = imagesToUpload.map((img) => img.imagePath);
            const presignedResult = await fetchPresignedUrls(albumPath, imagePaths);
            if (!presignedResult.success) {
                throw new Error(presignedResult.error);
            }
            const presignedUrls = presignedResult.urls;

            // Enqueue uploads
            for (const imageToUpload of imagesToUpload) {
                this.#uploadEnqueued(imageToUpload.imagePath, imageToUpload.file);
            }

            // Upload to S3 in parallel
            const imageUploads: Promise<void>[] = [];
            for (const imageToUpload of imagesToUpload) {
                const presignedUrl = presignedUrls[imageToUpload.imagePath];
                if (!presignedUrl) {
                    this.#uploadErrored(imageToUpload.imagePath, `No presigned URL for image`);
                    continue;
                }
                imageUploads.push(this.#uploadImageViaPresignedUrl(imageToUpload, presignedUrl));
            }
            await Promise.allSettled(imageUploads);
            await this.#pollForProcessedImages(albumPath);
        } catch (e) {
            // Clean up any uploads that were enqueued before the failure
            for (const imageToUpload of imagesToUpload) {
                this.#uploadComplete(imageToUpload.imagePath);
            }
            toast.push(`${e}`);
            return;
        }
    }

    async #uploadImageViaPresignedUrl(imageToUpload: ImageToUpload, presignedUrl: string): Promise<void> {
        this.#uploadStarted(imageToUpload.imagePath);
        const result = await uploadToS3(imageToUpload.file, presignedUrl);
        if (result.success) {
            console.log(`Uploaded image [${imageToUpload.imagePath}], got versionId [${result.versionId}]`);
            this.#uploadProcessing(imageToUpload.imagePath, result.versionId);
        } else {
            this.#uploadErrored(imageToUpload.imagePath, result.error);
        }
    }

    /**
     * Poll the server, checking to see if the images have made it into the album
     */
    async #pollForProcessedImages(albumPath: string): Promise<void> {
        const POLL_INTERVAL_MS = 1500;
        const MAX_POLL_ATTEMPTS = 10;

        let processingComplete = false;
        let pollAttemptCount = 0;
        do {
            await sleep(POLL_INTERVAL_MS);
            processingComplete = await this.#areImagesProcessed(albumPath);
            pollAttemptCount++;
        } while (!processingComplete && pollAttemptCount < MAX_POLL_ATTEMPTS);
        console.log(`Images have been processed.  Loop count: [${pollAttemptCount}]`);

        // If polling timed out with images still processing, clear them from UI and notify user
        if (!processingComplete) {
            const remaining = getUploadsForAlbum(albumPath);
            for (const upload of remaining) {
                this.#uploadComplete(upload.imagePath);
            }
            toast.push('Some images are still processing. Refresh to see them when ready.');
        }
    }

    async #areImagesProcessed(albumPath: string): Promise<boolean> {
        const uploads = getUploadsForAlbum(albumPath);
        if (!uploads || uploads.length === 0) return true;
        try {
            await albumLoadMachine.fetchFromServer(albumPath);
            const album = albumState.albums.get(albumPath)?.album;
            if (!album) throw new Error('album not loaded');

            const { processed, allProcessed } = findProcessedUploads(uploads, (imagePath) => {
                const image = album.getImage(imagePath);
                return image?.versionId;
            });

            for (const imagePath of processed) {
                this.#uploadComplete(imagePath);
            }

            return allProcessed;
        } catch (e) {
            console.error(`Error checking if images are processed`, e);
            return false;
        }
    }
}
export const uploadMachine = new UploadMachine();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

//
// Utils for working with machine
//

export function getSanitizedFiles(files: FileList | File[], albumPath: string): ImageToUpload[] {
    // Create sanitized paths for all files
    const filesWithPaths: ImageToUpload[] = [];
    for (const file of files) {
        const imagePath = albumPath + sanitizeImageName(file.name);
        filesWithPaths.push({ file, imagePath });
    }

    // Deduplicate paths (e.g., photo-1.jpg and photo_1.jpg both become photo_1.jpg)
    const originalPaths = filesWithPaths.map((f) => f.imagePath);
    const deduplicatedPaths = deduplicateImagePaths(originalPaths);

    // Build result with deduplicated paths
    const result: ImageToUpload[] = [];
    for (let i = 0; i < filesWithPaths.length; i++) {
        const imagePath = deduplicatedPaths[i];
        result.push({ file: filesWithPaths[i].file, imagePath });
    }
    return result;
}
