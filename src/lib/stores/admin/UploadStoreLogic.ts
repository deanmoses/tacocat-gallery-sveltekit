import { get } from 'svelte/store';
import { produce } from 'immer';
import { toast } from '@zerodevx/svelte-toast';
import { albumStore } from '$lib/stores/AlbumStore';
import {
    getParentFromPath,
    hasValidExtension,
    isValidDayAlbumPath,
    isValidImagePath,
    sanitizeImageName,
} from '$lib/utils/galleryPathUtils';
import { page } from '$app/stores';
import { UploadState, type UploadEntry } from '$lib/models/album';
import { getUploads, mock, uploadStore, type UploadStore } from '../UploadStore';
import { getPresignedUploadUrlGenerationUrl } from '$lib/utils/config';

/**
 * Upload the specified single image file to overwrite the image at the specified path
 *
 * @param file A File object from browser's file picker
 * @param imagePath image to replace
 */
export async function uploadSingleImage(file: File, imagePath: string): Promise<void> {
    if (!file) return;
    if (!isValidImagePath(imagePath)) throw new Error(`Invalid image path: [${imagePath}]`);
    if (!hasValidExtension(file.name)) {
        const msg = `Skipping invalid type of image [${file.name}]`;
        toast.push(msg);
        console.error(msg);
        return;
    }
    console.log(`Replacing [${imagePath}] with [${file.name}]`);
    addUpload(file, imagePath);
    const imagesToUpload: ImagesToUpload[] = [{ file, imagePath }];
    await uploadImages(imagesToUpload);
    const albumPath = getParentFromPath(imagePath);
    await pollForProcessedImages(albumPath);
}

/**
 * Upload the specified images to the specified album, overwriting any existing images
 *
 * @param files File objects from browser's file picker or drag/drop
 * @param albumPath album path
 */
export async function upload(files: FileList | File[] | null | undefined, albumPath: string): Promise<void> {
    if (!files) return;
    if (!isValidDayAlbumPath(albumPath)) throw new Error(`Invalid day album path: [${albumPath}]`);
    console.log(`I'll upload [${files.length}] images to album [${albumPath}]`);
    const imagesToUpload = getSanitizedFiles(files, albumPath);
    uploadSanitizedImages(imagesToUpload, albumPath);
}

export async function uploadSanitizedImages(imagesToUpload: ImagesToUpload[], albumPath: string): Promise<void> {
    if (!imagesToUpload || imagesToUpload.length === 0) return;
    await uploadImages(imagesToUpload);
    await pollForProcessedImages(albumPath);
}

export function getSanitizedFiles(files: FileList | File[], albumPath: string): ImagesToUpload[] {
    let imagesToUpload: ImagesToUpload[] = [];
    for (let file of files) {
        if (!hasValidExtension(file.name)) {
            const msg = `Skipping invalid type of image [${file.name}]`;
            toast.push(msg);
            console.error(msg);
        } else {
            const imagePath = albumPath + sanitizeImageName(file.name);
            console.log(`Adding [${imagePath}]`);
            imagesToUpload.push({ file, imagePath });
        }
    }
    return imagesToUpload;
}

export function getFilesAlreadyInAlbum(files: ImagesToUpload[], albumPath: string): string[] {
    let imageNames: string[] = [];
    const albumEntry = albumStore.getFromInMemory(albumPath);
    if (!albumEntry || !albumEntry.album || !albumEntry.album?.images?.length) return imageNames;
    for (let file of files) {
        const image = albumEntry.album?.getImage(file.imagePath);
        if (image) {
            console.log(`File [${file.imagePath}] is already in album [${albumPath}]`);
            imageNames.push(file.file.name);
        }
    }
    return imageNames;
}

export type ImagesToUpload = {
    file: File;
    imagePath: string;
};

async function uploadImages(imagesToUpload: ImagesToUpload[]): Promise<void> {
    try {
        const presignedUrls = await getPresignedUploadUrls(imagesToUpload);
        for (let imageToUpload of imagesToUpload) {
            addUpload(imageToUpload.file, imageToUpload.imagePath);
        }
        const imageUploads: Promise<void>[] = [];
        for (let imageToUpload of imagesToUpload) {
            const presignedUrl = presignedUrls[imageToUpload.imagePath];
            if (!presignedUrl) throw new Error(`No presigned URL for image [${imageToUpload.imagePath}]`);
            imageUploads.push(uploadImageViaPresignedUrl(imageToUpload, presignedUrl));
        }
        await Promise.allSettled(imageUploads);
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
async function getPresignedUploadUrls(imagesToUpload: ImagesToUpload[]): Promise<{ [key: string]: string }> {
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

async function uploadImageViaPresignedUrl(imageToUpload: ImagesToUpload, presignedUrl: string): Promise<void> {
    updateUploadState(imageToUpload.imagePath, UploadState.UPLOADING);
    try {
        if (mock) await sleep(2000);
        else {
            const versionId = await uploadViaPresignedUrl(imageToUpload, presignedUrl);
            markUploadAsProcessing(imageToUpload.imagePath, versionId);
        }
    } catch (e) {
        console.error(`Error uploading [${imageToUpload.imagePath}]`, e);
        removeUpload(imageToUpload.imagePath);
        toast.push(`Error uploading [${imageToUpload.imagePath}]`);
    }
}

/** Upload using a presigned URL */
async function uploadViaPresignedUrl(imageToUpload: ImagesToUpload, presignedUrl: string): Promise<string> {
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
async function pollForProcessedImages(albumPath: string): Promise<void> {
    let processingComplete = false;
    let count = 0;
    do {
        await sleep(1500);
        processingComplete = mock ? await areMockImagesProcessed(albumPath) : await areImagesProcessed(albumPath);
        count++;
    } while (!processingComplete && count <= 5);
    console.log(`Images have been processed.  Loop count: [${count}]`);
}

async function areMockImagesProcessed(albumPath: string): Promise<boolean> {
    const uploads = get(getUploads(albumPath));
    if (!uploads || uploads.length === 0) return true;
    sleep(400);
    const upload = uploads[0];
    removeUpload(upload.imagePath);
    return false;
}

async function areImagesProcessed(albumPath: string): Promise<boolean> {
    const uploads = get(getUploads(albumPath));
    if (!uploads || uploads.length === 0) return true;
    try {
        const album = await albumStore.fetchFromServerAsync(albumPath);
        for (let upload of uploads) {
            // Skip checking uploads that are not yet in the processing state,
            // which means they have not yet been uploaded to S3, which means
            // they don't yet have a version (the versionId check is redundant)
            if (upload.status !== UploadState.PROCESSING || !upload.versionId) return false;
            const image = album.getImage(upload.imagePath);
            if (image && image.versionId == upload.versionId) {
                // Found image. Remove it from list of images being processed
                removeUpload(upload.imagePath);
            } else {
                console.log(
                    `Did not find file [${upload.imagePath}] version [${upload.versionId}] in the album, it must still be processing`,
                );
                return false;
            }
        }
        console.log(`Found all uploaded files in the album, processing complete!`);
        return true;
    } catch (e) {
        console.error(`Error checking if images are processed`, e);
        return false;
    }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

//
// Below this is code to handle drag and drop, could be separate file
//

export async function dropImages(e: DragEvent) {
    const files = await getDroppedImages(e);
    const albumPath = get(page).url.pathname + '/';
    await upload(files, albumPath);
}

export async function getDroppedImages(e: DragEvent): Promise<File[]> {
    e.preventDefault(); // Prevent default behavior, which is the browser opening the files
    let files: File[] = [];
    if (!e.dataTransfer) {
        console.log('No dataTransfer');
        return files;
    }
    if (e.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (const item of e.dataTransfer.items) {
            const itemEntry = item.webkitGetAsEntry();
            if (itemEntry?.isDirectory) {
                const x = await getFilesInDirectory(itemEntry as FileSystemDirectoryEntry);
                files = files.concat(x);
            } else if (itemEntry?.isFile) {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                } else {
                    console.log(`There warn't no file name in ${file}`);
                }
            } else {
                console.log(`Unrecognized type of file`, item, itemEntry);
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        [...e.dataTransfer.files].forEach((file) => {
            files.push(file);
        });
    }
    return files;
}

/**
 * Get all the File objects in a directory
 */
async function getFilesInDirectory(directory: FileSystemDirectoryEntry): Promise<File[]> {
    let files: File[] = [];
    const entries = await readAllDirectoryEntries(directory);
    for (const entry of entries) {
        if (entry.isFile) {
            //console.log(`Directory item`, entry);
            const fileEntry = entry as FileSystemFileEntry;
            const file = await readEntryContentAsync(fileEntry);
            //console.log(`Adding file [${file.name}] of type [${file.type}]`);
            files.push(file);
        } else {
            console.log(`Directory item is not a file`, entry);
        }
    }
    return files;
}

/**
 * Read all the entries in a directory
 */
const readAllDirectoryEntries = async (directory: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> => {
    const directoryReader = directory.createReader();

    // To read all files in a directory, readEntries needs to be called
    // repeatedly until it returns an empty array.  Chromium-based
    // browsers will only return a max of 100 entries per call
    let entries = [];
    let readEntries = await readEntriesPromise(directoryReader);
    while (readEntries.length > 0) {
        entries.push(...readEntries);
        readEntries = await readEntriesPromise(directoryReader);
    }
    return entries;
};

/**
 * Wrap FileSystemDirectoryReader.readEntries() in a promise to enable using await
 */
const readEntriesPromise = async (directoryReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
    return await new Promise((resolve, reject) => {
        directoryReader.readEntries(resolve, reject);
    });
};

/**
 * Wrap FileSystemFileEntry.file() in a promise to enable using await
 */
const readEntryContentAsync = async (entry: FileSystemFileEntry): Promise<File> => {
    return new Promise((resolve, reject) => {
        entry.file(resolve, reject);
    });
};

///////////////////////////////////////////////////////////////////////////////
// Svelte store mutators
///////////////////////////////////////////////////////////////////////////////

function addUpload(file: File, imagePath: string): void {
    const upload: UploadEntry = {
        file,
        imagePath,
        status: UploadState.UPLOAD_NOT_STARTED,
    };
    uploadStore.update((oldValue: UploadStore) =>
        produce(oldValue, (draftState: UploadStore) => {
            draftState.push(upload);
            return draftState;
        }),
    );
}

function updateUploadState(imagePath: string, status: UploadState): void {
    uploadStore.update((oldValue: UploadStore) =>
        produce(oldValue, (draftState: UploadStore) => {
            const upload = draftState.find((upload) => upload.imagePath === imagePath);
            if (upload) upload.status = status;
            return draftState;
        }),
    );
}

function markUploadAsProcessing(imagePath: string, versionId: string): void {
    uploadStore.update((oldValue: UploadStore) =>
        produce(oldValue, (draftState: UploadStore) => {
            const upload = draftState.find((upload) => upload.imagePath === imagePath);
            if (upload) {
                upload.status = UploadState.PROCESSING;
                upload.versionId = versionId;
            }
            return draftState;
        }),
    );
}

function removeUpload(imagePath: string): void {
    uploadStore.update((oldValue: UploadStore) =>
        produce(oldValue, (draftState: UploadStore) => draftState.filter((upload) => upload.imagePath !== imagePath)),
    );
}
