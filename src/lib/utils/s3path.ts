import { isValidPath } from './galleryPathUtils';

/**
 * Given a gallery album or image path like /2001/12-31/ or /2001/12-31/image.jpg,
 * return that item's key in the S3 orignal images bucket
 */
export function fromPathToS3OriginalBucketKey(path: string): string {
    if (!isValidPath(path)) throw new Error(`Invalid path: [${path}]`);
    return path.substring(1); // remove the starting '/' from path
}

/**
 * Given a gallery album or image key in S3 originals bucket like 2001/12-31/ or 2001/12-31/image.jpg
 * (note missing leading slash), return that item's regular gallery path
 */
export function fromS3OriginalBucketKeyToPath(key: string): string {
    return '/' + key;
}

export function fromPathToS3DerivedImagesBucketKey(path: string): string {
    if (!isValidPath(path)) throw new Error(`Invalid path: [${path}]`);
    return 'i' + path; // all images are under the '/i/' "folder"
}
