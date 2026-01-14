import { getPresignedUploadUrlGenerationUrl } from './config';
import { adminApi } from './adminApi';

export type S3UploadResult = { success: true; versionId: string } | { success: false; error: string };

export type PresignedUrlResult = { success: true; urls: Record<string, string> } | { success: false; error: string };

/**
 * Upload a file to S3 via presigned URL.
 *
 * @param file File to upload
 * @param presignedUrl S3 presigned URL
 * @returns Success with versionId, or failure with error message
 */
export async function uploadToS3(file: File, presignedUrl: string): Promise<S3UploadResult> {
    try {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type,
            },
            body: file,
        });

        if (!response.ok) {
            return { success: false, error: response.statusText };
        }

        const versionId = response.headers.get('x-amz-version-id');
        if (!versionId) {
            return {
                success: false,
                error: 'No versionId returned. Check bucket CORS configuration for x-amz-version-id header.',
            };
        }

        return { success: true, versionId };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { success: false, error: msg };
    }
}

/**
 * Fetch presigned upload URLs from the server.
 *
 * @param albumPath Album path like /2024/01-01/
 * @param imagePaths Array of full image paths like /2024/01-01/photo.jpg
 * @returns Map of image path to presigned URL, or failure with error message
 */
export async function fetchPresignedUrls(albumPath: string, imagePaths: string[]): Promise<PresignedUrlResult> {
    try {
        const response = await adminApi.post(getPresignedUploadUrlGenerationUrl(albumPath), imagePaths);

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            const msg = body.errorMessage || response.statusText;
            return { success: false, error: msg };
        }

        const urls = await response.json();
        return { success: true, urls };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { success: false, error: msg };
    }
}
