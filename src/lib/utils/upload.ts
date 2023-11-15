import { Upload } from '@aws-sdk/lib-storage';
import { S3Client } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { isValidDayAlbumPath, isValidImageName, sanitizeImageName } from './galleryPathUtils';
import { fromPathToS3OriginalBucketKey } from './s3path';

export async function upload(files: FileList, albumPath: string): Promise<void> {
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
