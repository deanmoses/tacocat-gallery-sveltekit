import { Upload } from '@aws-sdk/lib-storage';
import { S3Client } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { isValidDayAlbumPath, isValidImageName, sanitizeImageName } from './galleryPathUtils';
import { fromPathToS3OriginalBucketKey } from './s3path';
import { albumStore } from '$lib/stores/AlbumStore';

export async function upload(files: FileList | File[], albumPath: string): Promise<void> {
    if (!!files) {
        if (!isValidDayAlbumPath(albumPath)) throw new Error(`Invalid day album path: [${albumPath}]`);
        for (let file of files) {
            if (!isValidImageName(file.name)) {
                console.error(`Skipping invalid image name [${file.name}]`);
            } else {
                const imagePath = albumPath + sanitizeImageName(file.name);
                try {
                    await uploadImage(file, imagePath);
                } catch (e) {
                    console.error(`Error uploading [${file.name}]`, e);
                }
            }
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

    upload.on('httpUploadProgress', (progress: unknown) => {
        console.info('HTTP Upload Progress', progress);
    });

    const results = await upload.done();
    if (results.$metadata.httpStatusCode != 200) {
        const msg = `Got non-200 status code [${results.$metadata.httpStatusCode}] uploading image`;
        console.error(msg, results);
        return msg;
    } else {
        console.info(`Uploaded image `, results);
    }
}

export async function pollForProcessedImages(files: FileList | File[], albumPath: string) {
    let processingComplete = false;
    let count = 0;
    do {
        await sleep(1500);
        processingComplete = await areImagesProcessed(files, albumPath);
        count++;
    } while (!processingComplete && count <= 5);
    console.log(`Images have been processed.  Count: [${count}]`);
    albumStore.get(albumPath);
}

async function areImagesProcessed(files: FileList | File[], albumPath: string): Promise<boolean> {
    if (!files || files.length === 0) return false;
    const album = await albumStore.fetchFromServerAsync(albumPath);
    for (let file of files) {
        const imagePath = albumPath + file.name;
        if (!album.getImage(imagePath)) {
            console.log(`Did not find file [${file.name}] in the album, it must still be processing`);
            return false;
        }
    }
    console.log(`Found all uploaded files in the album, processing complete!`);
    return true;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
