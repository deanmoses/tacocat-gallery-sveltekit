import { toast } from '@zerodevx/svelte-toast';
import { ImageStatus, type ImageEntry } from '$lib/models/album';
import { albumState, getUploadsForAlbum } from '../AlbumState.svelte';
import { sanitizeImageName, hasValidExtension, getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
import { getPresignedUploadUrlGenerationUrl } from '$lib/utils/config';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';

export type ImagesToUpload = {
    file: File;
    imagePath: string;
};

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

    uploadImages(albumPath: string, imagesToUpload: ImagesToUpload[]): void {
        this.#uploadImages(albumPath, imagesToUpload); // invoke async service in fire-and-forget fashion
    }

    #uploadEnqueued(imagePath: string, file: File): void {
        albumState.images.set(imagePath, {
            status: ImageStatus.UPLOAD_QUEUED,
            upload: {
                file,
                imagePath,
            },
        });
    }

    #uploadStarted(imagePath: string): void {
        const imageEntry = albumState.images.get(imagePath);
        if (imageEntry?.upload) imageEntry.status = ImageStatus.UPLOAD_TRANSFERRING;
    }

    #uploadProcessing(imagePath: string, versionId: string): void {
        // TODO: make this immutable with Immer
        const imageEntry = albumState.images.get(imagePath);
        if (imageEntry?.upload) {
            imageEntry.status = ImageStatus.UPLOAD_PROCESSING;
            imageEntry.upload.versionId = versionId;
        }
    }

    #uploadErrored(imagePath: string, errorMessage: string): void {
        console.error(`Error uploading [${imagePath}]: ${errorMessage}`);
        toast.push(`Error uploading [${imagePath}]: ${errorMessage}`);
    }

    #uploadSkipped(imagePath: string, skipMessage: string): void {
        console.error(`Skipping upload [${imagePath}]: ${skipMessage}`);
        toast.push(`Skipping upload [${imagePath}]: ${skipMessage}`);
    }

    #uploadComplete(imagePath: string): void {
        albumState.images.delete(imagePath);
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
            const imagesToUpload: ImagesToUpload[] = [{ file, imagePath }];
            await this.#uploadImages(albumPath, imagesToUpload);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.#uploadErrored(imagePath, msg);
        }
    }

    async #uploadImages(albumPath: string, imagesToUpload: ImagesToUpload[]): Promise<void> {
        try {
            if (!imagesToUpload || imagesToUpload.length === 0) throw new Error('No images to upload');

            imagesToUpload = imagesToUpload.filter((imageToUpload) => {
                try {
                    if (!isValidImagePath(imageToUpload.imagePath))
                        throw new Error(`Invalid image path: [${imageToUpload.imagePath}]`);
                    if (!hasValidExtension(imageToUpload.file.name))
                        throw new Error(`invalid type of image [${imageToUpload.file.name}]`);
                    return true;
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    this.#uploadSkipped(imageToUpload.imagePath, msg);
                    return false;
                }
            });
            const presignedUrls = await this.#getPresignedUploadUrls(imagesToUpload);
            for (const imageToUpload of imagesToUpload) {
                this.#uploadEnqueued(imageToUpload.imagePath, imageToUpload.file);
            }
            const imageUploads: Promise<void>[] = [];
            for (const imageToUpload of imagesToUpload) {
                try {
                    const presignedUrl = presignedUrls[imageToUpload.imagePath];
                    if (!presignedUrl) throw new Error(`No presigned URL for image [${imageToUpload.imagePath}]`);
                    imageUploads.push(this.#uploadImageViaPresignedUrl(imageToUpload, presignedUrl));
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    this.#uploadErrored(imageToUpload.imagePath, msg);
                }
            }
            await Promise.allSettled(imageUploads);
            await this.#pollForProcessedImages(albumPath);
        } catch (e) {
            toast.push(`${e}`);
            return;
        }
    }

    /**
     * Retrieve presigned image upload URLs from server
     *
     * @returns map of image path to presigned URL
     */
    async #getPresignedUploadUrls(imagesToUpload: ImagesToUpload[]): Promise<{ [key: string]: string }> {
        const albumPath = getParentFromPath(imagesToUpload[0].imagePath);
        const imagePaths = imagesToUpload.map((imageToUpload) => imageToUpload.imagePath);
        const response = await fetch(getPresignedUploadUrlGenerationUrl(albumPath), {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(imagePaths),
        });
        if (!response.ok) {
            const msg = (await response.json()).errorMessage || response.statusText;
            throw msg;
        }
        const presignedUploadUrls = await response.json();
        return presignedUploadUrls;
    }

    async #uploadImageViaPresignedUrl(imageToUpload: ImagesToUpload, presignedUrl: string): Promise<void> {
        this.#uploadStarted(imageToUpload.imagePath);
        try {
            const versionId = await this.#uploadViaPresignedUrl(imageToUpload, presignedUrl);
            this.#uploadProcessing(imageToUpload.imagePath, versionId);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.#uploadErrored(imageToUpload.imagePath, msg);
        }
    }

    /** Upload using a presigned URL */
    async #uploadViaPresignedUrl(imageToUpload: ImagesToUpload, presignedUrl: string): Promise<string> {
        console.log(`Uploading image [${imageToUpload.imagePath}]`);
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': imageToUpload.file.type,
            },
            body: imageToUpload.file,
        });
        if (!response.ok) {
            throw response.statusText;
        }
        const versionId = response.headers.get('x-amz-version-id');
        if (!versionId) {
            console.error(
                `No versionId for image [${imageToUpload.imagePath}].  Does the bucket's CORS configuration allow the browser to read the x-amz-version-id header?`,
                response,
            );
            throw new Error(`No versionId for image ${imageToUpload.imagePath}`);
        }
        console.log(`Uploaded image [${imageToUpload.imagePath}], got versionId [${versionId}]`);
        return versionId;
    }

    /**
     * Poll the server, checking to see if the images have made it into the album
     */
    async #pollForProcessedImages(albumPath: string): Promise<void> {
        let processingComplete = false;
        let count = 0;
        do {
            await sleep(1500);
            processingComplete = await this.#areImagesProcessed(albumPath);
            count++;
        } while (!processingComplete && count <= 5);
        console.log(`Images have been processed.  Loop count: [${count}]`);
    }

    async #areImagesProcessed(albumPath: string): Promise<boolean> {
        const uploads: ImageEntry[] = getUploadsForAlbum(albumPath);
        if (!uploads || uploads.length === 0) return true;
        try {
            await albumLoadMachine.fetchFromServer(albumPath);
            const album = albumState.albums.get(albumPath)?.album;
            if (!album) throw new Error(`Album [${albumPath}] not loaded`);
            for (const imageEntry of uploads) {
                const status = imageEntry.status;

                // If the image hasn't finished uploading, images aren't yet processed
                if (status === ImageStatus.UPLOAD_QUEUED || status === ImageStatus.UPLOAD_TRANSFERRING) return false;

                if (ImageStatus.UPLOAD_PROCESSING === status) {
                    // Uploading images should always have an upload object
                    const upload = imageEntry.upload;
                    if (!upload) throw new Error(`No upload object for image [${imageEntry}]`);

                    // Processing images should always have a versionId from S3
                    if (!upload.versionId) throw new Error(`No versionId for image [${upload.imagePath}]`);

                    const image = album.getImage(upload.imagePath);
                    if (image && image.versionId == upload.versionId) {
                        // Found image. Remove it from list of images being processed
                        this.#uploadComplete(upload.imagePath);
                    } else {
                        console.log(
                            `Did not find file [${upload.imagePath}] version [${upload.versionId}] in the album, it must still be processing`,
                        );
                        return false;
                    }
                }
            }
            console.log(`Found all uploaded files in the album, processing complete!`);
            return true;
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

export function getSanitizedFiles(files: FileList | File[], albumPath: string): ImagesToUpload[] {
    const imagesToUpload: ImagesToUpload[] = [];
    for (const file of files) {
        const imagePath = albumPath + sanitizeImageName(file.name);
        if (!hasValidExtension(file.name)) {
            console.log(`Skipping invalid type of image [${file.name}]`);
        } else {
            console.log(`Adding [${imagePath}]`);
            imagesToUpload.push({ file, imagePath });
        }
    }
    return imagesToUpload;
}
