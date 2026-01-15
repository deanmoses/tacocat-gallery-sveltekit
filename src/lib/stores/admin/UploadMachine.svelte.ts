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
import { getImagePath } from '$lib/utils/fileFormats';

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

    uploadImage(uploadPath: string, file: File, previousVersionId?: string): void {
        this.#uploadImage(uploadPath, file, previousVersionId); // invoke async service in fire-and-forget fashion
    }

    uploadImages(albumPath: string, imagesToUpload: ImageToUpload[]): void {
        this.#uploadImages(albumPath, imagesToUpload); // invoke async service in fire-and-forget fashion
    }

    #uploadEnqueued(uploadPath: string, file: File, previousVersionId?: string): void {
        albumState.uploads.push({
            file,
            uploadPath,
            imagePath: getImagePath(uploadPath),
            status: UploadState.UPLOAD_NOT_STARTED,
            previousVersionId,
        });
    }

    #uploadStarted(uploadPath: string): void {
        const upload = albumState.uploads.find((u) => u.uploadPath === uploadPath);
        if (!upload) {
            console.warn(`Upload not found for path: ${uploadPath}`);
            return;
        }
        upload.status = UploadState.UPLOADING;
    }

    #uploadProcessing(uploadPath: string, versionId: string): void {
        const upload = albumState.uploads.find((u) => u.uploadPath === uploadPath);
        if (!upload) {
            console.warn(`Upload not found for path: ${uploadPath}`);
            return;
        }
        upload.status = UploadState.PROCESSING;
        upload.versionId = versionId;
    }

    #uploadErrored(uploadPath: string, errorMessage: string): void {
        console.error(`Error uploading [${uploadPath}]: ${errorMessage}`);
        toast.push(`Error uploading [${uploadPath}]: ${errorMessage}`);
        this.#uploadComplete(uploadPath);
    }

    #uploadSkipped(uploadPath: string, skipMessage: string): void {
        console.error(`Skipping upload [${uploadPath}]: ${skipMessage}`);
        toast.push(`Skipping upload [${uploadPath}]: ${skipMessage}`);
    }

    #uploadComplete(uploadPath: string): void {
        // remove upload from list
        albumState.uploads = albumState.uploads.filter((upload) => upload.uploadPath !== uploadPath);
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
     * @param uploadPath path to upload to
     * @param file A File object from browser's file picker
     * @param previousVersionId For replacements: versionId of the image being replaced
     */
    async #uploadImage(uploadPath: string, file: File, previousVersionId?: string): Promise<void> {
        if (!file) return;
        try {
            const albumPath = getParentFromPath(uploadPath);
            this.#uploadEnqueued(uploadPath, file, previousVersionId);
            await this.#uploadSingleImage(albumPath, { file, uploadPath });
            await this.#pollForProcessedImages(albumPath);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.#uploadErrored(uploadPath, msg);
        }
    }

    /** Upload a single image after it's been enqueued */
    async #uploadSingleImage(albumPath: string, imageToUpload: ImageToUpload): Promise<void> {
        // Validate extension and path
        if (!hasValidExtension(imageToUpload.file.name)) {
            this.#uploadSkipped(imageToUpload.uploadPath, `Invalid file type: [${imageToUpload.file.name}]`);
            this.#uploadComplete(imageToUpload.uploadPath);
            return;
        }
        if (!isValidImagePath(imageToUpload.uploadPath)) {
            this.#uploadSkipped(imageToUpload.uploadPath, `Invalid image path: [${imageToUpload.uploadPath}]`);
            this.#uploadComplete(imageToUpload.uploadPath);
            return;
        }

        // Validate image content
        const validationResult = await validateImageBatch([imageToUpload]);
        if (validationResult.invalid.length > 0) {
            this.#uploadSkipped(imageToUpload.uploadPath, 'Invalid or corrupted image file');
            this.#uploadComplete(imageToUpload.uploadPath);
            return;
        }

        // Get presigned URL and upload
        const presignedResult = await fetchPresignedUrls(albumPath, [imageToUpload.uploadPath]);
        if (!presignedResult.success) {
            throw new Error(presignedResult.error);
        }
        const presignedUrl = presignedResult.urls[imageToUpload.uploadPath];
        if (!presignedUrl) {
            throw new Error('No presigned URL for image');
        }
        await this.#uploadImageViaPresignedUrl(imageToUpload, presignedUrl);
    }

    async #uploadImages(albumPath: string, imagesToUpload: ImageToUpload[]): Promise<void> {
        try {
            if (!imagesToUpload || imagesToUpload.length === 0) throw new Error('No images to upload');

            // Validate file extensions and image paths
            imagesToUpload = imagesToUpload.filter((imageToUpload) => {
                if (!hasValidExtension(imageToUpload.file.name)) {
                    this.#uploadSkipped(imageToUpload.uploadPath, `Invalid file type: [${imageToUpload.file.name}]`);
                    return false;
                }
                if (!isValidImagePath(imageToUpload.uploadPath)) {
                    this.#uploadSkipped(imageToUpload.uploadPath, `Invalid image path: [${imageToUpload.uploadPath}]`);
                    return false;
                }
                return true;
            });
            if (imagesToUpload.length === 0) return;

            // Validate image content (checks file size > 0 and that browser can load the image)
            const validationResult = await validateImageBatch(imagesToUpload);
            for (const uploadPath of validationResult.invalid) {
                this.#uploadSkipped(uploadPath, 'Invalid or corrupted image file');
            }
            imagesToUpload = validationResult.valid;
            if (imagesToUpload.length === 0) return;

            // Get presigned URLs
            const uploadPaths = imagesToUpload.map((img) => img.uploadPath);
            const presignedResult = await fetchPresignedUrls(albumPath, uploadPaths);
            if (!presignedResult.success) {
                throw new Error(presignedResult.error);
            }
            const presignedUrls = presignedResult.urls;

            // Enqueue uploads
            for (const imageToUpload of imagesToUpload) {
                this.#uploadEnqueued(imageToUpload.uploadPath, imageToUpload.file, imageToUpload.previousVersionId);
            }

            // Upload to S3 in parallel
            const imageUploads: Promise<void>[] = [];
            for (const imageToUpload of imagesToUpload) {
                const presignedUrl = presignedUrls[imageToUpload.uploadPath];
                if (!presignedUrl) {
                    this.#uploadErrored(imageToUpload.uploadPath, `No presigned URL for image`);
                    continue;
                }
                imageUploads.push(this.#uploadImageViaPresignedUrl(imageToUpload, presignedUrl));
            }
            await Promise.allSettled(imageUploads);
            await this.#pollForProcessedImages(albumPath);
        } catch (e) {
            // Clean up any uploads that were enqueued before the failure
            for (const imageToUpload of imagesToUpload) {
                this.#uploadComplete(imageToUpload.uploadPath);
            }
            toast.push(`${e}`);
            return;
        }
    }

    async #uploadImageViaPresignedUrl(imageToUpload: ImageToUpload, presignedUrl: string): Promise<void> {
        this.#uploadStarted(imageToUpload.uploadPath);
        const result = await uploadToS3(imageToUpload.file, presignedUrl);
        if (result.success) {
            console.log(`Uploaded image [${imageToUpload.uploadPath}], got versionId [${result.versionId}]`);
            this.#uploadProcessing(imageToUpload.uploadPath, result.versionId);
        } else {
            this.#uploadErrored(imageToUpload.uploadPath, result.error);
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
                this.#uploadComplete(upload.uploadPath);
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

            for (const uploadPath of processed) {
                this.#uploadComplete(uploadPath);
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
        const uploadPath = albumPath + sanitizeImageName(file.name);
        filesWithPaths.push({ file, uploadPath });
    }

    // Deduplicate paths (e.g., photo-1.jpg and photo_1.jpg both become photo_1.jpg)
    const originalPaths = filesWithPaths.map((f) => f.uploadPath);
    const deduplicatedPaths = deduplicateImagePaths(originalPaths);

    // Build result with deduplicated paths
    const result: ImageToUpload[] = [];
    for (let i = 0; i < filesWithPaths.length; i++) {
        const uploadPath = deduplicatedPaths[i];
        result.push({ file: filesWithPaths[i].file, uploadPath });
    }
    return result;
}
