/**
 * Svelte store of photos being uploaded.
 * This store will be empty unless there's an image upload in progress.
 */

import { produce } from 'immer';
import { get, writable, derived, type Readable } from 'svelte/store';
import { Upload } from '@aws-sdk/lib-storage';
import { S3Client } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { albumStore } from '$lib/stores/AlbumStore';
import {
    getParentFromPath,
    isValidDayAlbumPath,
    isValidImageName,
    isValidImagePath,
    sanitizeImageName,
} from '$lib/utils/galleryPathUtils';
import { fromPathToS3OriginalBucketKey } from '$lib/utils/s3path';
import { page } from '$app/stores';

const mock = false;

type UploadStore = UploadEntry[];

/**
 * An entry in the upload store
 * Represents a single image being uploaded
 */
export type UploadEntry = {
    file: File;
    imagePath: string;
    status: UploadState;
};

export enum UploadState {
    UPLOAD_NOT_STARTED = 'Not Started',
    UPLOADING = 'Uploading',
    PROCESSING = 'Processing',
}

const initialState: UploadStore = !mock
    ? []
    : [
          {
              imagePath: '/2001/01-01/image1.jpg',
              status: UploadState.UPLOAD_NOT_STARTED,
              file: new File([], 'image1.jpg'),
          },
          {
              imagePath: '/2001/01-01/image2.jpg',
              status: UploadState.UPLOAD_NOT_STARTED,
              file: new File([], 'image2.jpg'),
          },
          {
              imagePath: '/2001/01-01/image3.jpg',
              status: UploadState.UPLOAD_NOT_STARTED,
              file: new File([], 'image3.jpg'),
          },
      ];

const uploadStore = writable<UploadStore>(initialState);

export function getUploads(albumPath: string): Readable<UploadStore> {
    // Derive a read-only Svelte store over the uploads for a particular album
    return derived(uploadStore, ($store) => {
        return $store.filter((upload) => upload.imagePath.startsWith(albumPath));
    });
}

export function getUpload(imagePath: string): Readable<UploadEntry | undefined> {
    // Derive a read-only Svelte store over the uploads
    return derived(uploadStore, ($store) => $store.find((upload) => upload.imagePath === imagePath));
}

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

function removeUpload(imagePath: string): void {
    uploadStore.update((oldValue: UploadStore) =>
        produce(oldValue, (draftState: UploadStore) => draftState.filter((upload) => upload.imagePath !== imagePath)),
    );
}

//
// Svelte data store is above this
// Image uploading functionality is below this, it relies on the above data store
// They're in the same file to encapsulate the system, so that I don't have
// to expose the mutator methods on the data store to the rest of the system
//

/**
 * Upload the specified single image file to overwrite the image at the specified path
 *
 * @param file A File object from browser's file picker
 * @param imagePath image to replace
 */
export async function uploadSingleImage(file: File, imagePath: string): Promise<void> {
    if (!file) return;
    if (!isValidImageName(file.name)) {
        console.error(`Skipping invalid image name [${file.name}]`);
        return;
    }
    if (!isValidImagePath(imagePath)) throw new Error(`Invalid image path: [${imagePath}]`);
    const isValidImageType = file.name.endsWith('jpg') || file.name.endsWith('jpeg');
    if (!isValidImageType) {
        console.error(`Skipping invalid type of image [${file.name}]`);
        return;
    }
    console.log(`Adding [${imagePath}]`);
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
        if (!isValidImageName(file.name)) {
            console.error(`Skipping invalid image name [${file.name}]`);
        } else {
            const isValidImageType = file.name.endsWith('jpg') || file.name.endsWith('jpeg');
            if (!isValidImageType) {
                console.error(`Skipping invalid type of image [${file.name}]`);
            } else {
                const imagePath = albumPath + sanitizeImageName(file.name);
                console.log(`Adding [${imagePath}]`);
                imagesToUpload.push({ file, imagePath });
            }
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
    for (let imageToUpload of imagesToUpload) {
        addUpload(imageToUpload.file, imageToUpload.imagePath);
    }
    for (let imageToUpload of imagesToUpload) {
        updateUploadState(imageToUpload.imagePath, UploadState.UPLOADING);
        try {
            if (mock) await sleep(2000);
            else await uploadImage(imageToUpload.file, imageToUpload.imagePath);
        } catch (e) {
            console.error(`Error uploading [${imageToUpload.imagePath}]`, e);
        }
        updateUploadState(imageToUpload.imagePath, UploadState.PROCESSING);
    }
}

async function uploadImage(file: File, imagePath: string): Promise<string | undefined> {
    const key = fromPathToS3OriginalBucketKey(imagePath);
    const upload = new Upload({
        params: {
            Bucket: 'tacocat-gallery-sam-dev-original-images',
            Key: key,
            Body: file,
            ContentType: file.type,
        },
        client: new S3Client({
            region: 'us-east-1',
            credentials: fromCognitoIdentityPool({
                identityPoolId: 'us-east-1:fc3588c7-7907-40b7-8157-195778a5385e',
                clientConfig: { region: 'us-east-1' },
            }),
        }),
    });

    upload.on('httpUploadProgress', ({ loaded, total }) => {
        if (!loaded || !total) return;
        const percentComplete = Math.round((loaded / total) * 100);
        console.info(`Upload progress for [${imagePath}]: ${percentComplete}%`);
    });

    const results = await upload.done();
    if (results.$metadata.httpStatusCode != 200) {
        const msg = `Got non-200 status code [${results.$metadata.httpStatusCode}] uploading image [${imagePath}]`;
        console.error(msg, results);
        return msg;
    } else {
        console.info(`Uploaded image [${imagePath}]`, results);
    }
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
    const album = await albumStore.fetchFromServerAsync(albumPath);
    for (let upload of uploads) {
        if (album.getImage(upload.imagePath)) {
            // Found image. Remove it from list of images being processed
            removeUpload(upload.imagePath);
        } else {
            console.log(`Did not find file [${upload.imagePath}] in the album, it must still be processing`);
            return false;
        }
    }
    console.log(`Found all uploaded files in the album, processing complete!`);
    return true;
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
