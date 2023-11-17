import { Upload } from '@aws-sdk/lib-storage';
import { S3Client } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { isValidDayAlbumPath, isValidImageName, sanitizeImageName } from './galleryPathUtils';
import { fromPathToS3OriginalBucketKey } from './s3path';
import { albumStore } from '$lib/stores/AlbumStore';
import { addUpload, getUploads, removeUpload, updateUploadState } from '$lib/stores/UploadStore';
import { get } from 'svelte/store';

export async function upload(files: FileList | File[], albumPath: string): Promise<void> {
    await uploadImages(files, albumPath);
    await pollForProcessedImages(albumPath);
}

async function uploadImages(files: FileList | File[], albumPath: string): Promise<void> {
    if (!!files) {
        if (!isValidDayAlbumPath(albumPath)) throw new Error(`Invalid day album path: [${albumPath}]`);

        let imagesToUpload: { file: File; imagePath: string }[] = [];
        for (let file of files) {
            if (!isValidImageName(file.name)) {
                console.error(`Skipping invalid image name [${file.name}]`);
            } else {
                const imagePath = albumPath + sanitizeImageName(file.name);
                imagesToUpload.push({ file, imagePath });
                addUpload(file, imagePath);
            }
        }

        for (let imageToUpload of imagesToUpload) {
            updateUploadState(imageToUpload.imagePath, 'uploading');
            try {
                await uploadImage(imageToUpload.file, imageToUpload.imagePath);
            } catch (e) {
                console.error(`Error uploading [${imageToUpload.imagePath}]`, e);
            }
            updateUploadState(imageToUpload.imagePath, 'processing');
        }
    }
}

async function uploadImage(file: File, imagePath: string): Promise<string | undefined> {
    const key = fromPathToS3OriginalBucketKey(imagePath);
    const upload = new Upload({
        params: {
            Bucket: 'tacocat-gallery-sam-dev-original-images',
            Key: key,
            Body: file,
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

export async function pollForProcessedImages(albumPath: string) {
    let processingComplete = false;
    let count = 0;
    do {
        await sleep(1500);
        processingComplete = await areImagesProcessed(albumPath);
        count++;
    } while (!processingComplete && count <= 5);
    console.log(`Images have been processed.  Count: [${count}]`);
}

async function areImagesProcessed(albumPath: string): Promise<boolean> {
    const uploads = get(getUploads());
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
