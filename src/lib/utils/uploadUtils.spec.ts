import { test, expect, describe } from 'vitest';
import { findProcessedUploads, getUploadPathForReplacement } from './uploadUtils';
import { UploadState, type UploadEntry } from '$lib/models/album';
import { getMediaPath } from './fileFormats';

/**
 * Helper to create an UploadEntry for testing.
 * Uses a minimal mock File since we don't need file contents for these tests.
 */
function createUpload(
    uploadPath: string,
    status: UploadState,
    versionId?: string,
    previousVersionId?: string,
): UploadEntry {
    return {
        file: new File([], 'test.jpg'),
        uploadPath,
        mediaPath: getMediaPath(uploadPath),
        status,
        versionId,
        previousVersionId,
    };
}

describe('findProcessedUploads', () => {
    test('returns empty arrays when no uploads provided', () => {
        const result = findProcessedUploads([], () => undefined);

        expect(result.processed).toEqual([]);
        expect(result.allProcessed).toBe(true);
    });

    test('marks upload as processed when album has matching versionId', () => {
        const uploads = [createUpload('/2024/01-01/photo.jpg', UploadState.PROCESSING, 'version-123')];
        const getImageVersionId = (path: string) => (path === '/2024/01-01/photo.jpg' ? 'version-123' : undefined);

        const result = findProcessedUploads(uploads, getImageVersionId);

        expect(result.processed).toEqual(['/2024/01-01/photo.jpg']);
        expect(result.allProcessed).toBe(true);
    });

    test('marks upload as pending when album does not contain the image', () => {
        const uploads = [createUpload('/2024/01-01/photo.jpg', UploadState.PROCESSING, 'version-123')];
        const getImageVersionId = () => undefined; // Image not in album

        const result = findProcessedUploads(uploads, getImageVersionId);

        expect(result.processed).toEqual([]);
        expect(result.allProcessed).toBe(false);
    });

    test('marks upload as pending when versionId does not match', () => {
        const uploads = [createUpload('/2024/01-01/photo.jpg', UploadState.PROCESSING, 'version-123')];
        const getImageVersionId = () => 'different-version'; // Wrong version

        const result = findProcessedUploads(uploads, getImageVersionId);

        expect(result.processed).toEqual([]);
        expect(result.allProcessed).toBe(false);
    });

    test('marks upload as pending when status is UPLOADING (not yet on S3)', () => {
        const uploads = [createUpload('/2024/01-01/photo.jpg', UploadState.UPLOADING, undefined)];
        const getImageVersionId = () => 'version-123';

        const result = findProcessedUploads(uploads, getImageVersionId);

        expect(result.processed).toEqual([]);
        expect(result.allProcessed).toBe(false);
    });

    test('marks upload as pending when status is UPLOAD_NOT_STARTED', () => {
        const uploads = [createUpload('/2024/01-01/photo.jpg', UploadState.UPLOAD_NOT_STARTED, undefined)];
        const getImageVersionId = () => 'version-123';

        const result = findProcessedUploads(uploads, getImageVersionId);

        expect(result.processed).toEqual([]);
        expect(result.allProcessed).toBe(false);
    });

    test('marks upload as pending when PROCESSING but no versionId yet', () => {
        const uploads = [createUpload('/2024/01-01/photo.jpg', UploadState.PROCESSING, undefined)];
        const getImageVersionId = () => 'version-123';

        const result = findProcessedUploads(uploads, getImageVersionId);

        expect(result.processed).toEqual([]);
        expect(result.allProcessed).toBe(false);
    });

    //
    // THE BUG: Previously, the code would return early after finding the first
    // pending upload, never checking subsequent uploads. These tests verify
    // that ALL uploads are checked, not just the first one.
    //

    test('checks ALL uploads, not just the first one (bug fix)', () => {
        const uploads = [
            createUpload('/2024/01-01/a.jpg', UploadState.PROCESSING, 'v1'),
            createUpload('/2024/01-01/b.jpg', UploadState.PROCESSING, 'v2'),
            createUpload('/2024/01-01/c.jpg', UploadState.PROCESSING, 'v3'),
        ];
        const albumVersions: Record<string, string> = {
            '/2024/01-01/a.jpg': 'v1',
            '/2024/01-01/b.jpg': 'v2',
            '/2024/01-01/c.jpg': 'v3',
        };
        const getImageVersionId = (path: string) => albumVersions[path];

        const result = findProcessedUploads(uploads, getImageVersionId);

        expect(result.processed).toEqual(['/2024/01-01/a.jpg', '/2024/01-01/b.jpg', '/2024/01-01/c.jpg']);
        expect(result.allProcessed).toBe(true);
    });

    test('correctly categorizes mix of processed and pending uploads', () => {
        const uploads = [
            createUpload('/2024/01-01/processed1.jpg', UploadState.PROCESSING, 'v1'),
            createUpload('/2024/01-01/pending1.jpg', UploadState.PROCESSING, 'v2'),
            createUpload('/2024/01-01/processed2.jpg', UploadState.PROCESSING, 'v3'),
            createUpload('/2024/01-01/pending2.jpg', UploadState.UPLOADING, undefined),
        ];
        // Only processed1 and processed2 are in the album
        const albumVersions: Record<string, string> = {
            '/2024/01-01/processed1.jpg': 'v1',
            '/2024/01-01/processed2.jpg': 'v3',
        };
        const getImageVersionId = (path: string) => albumVersions[path];

        const result = findProcessedUploads(uploads, getImageVersionId);

        // Should find processed1, skip pending1 (not in album), find processed2, skip pending2 (still uploading)
        expect(result.processed).toEqual(['/2024/01-01/processed1.jpg', '/2024/01-01/processed2.jpg']);
        expect(result.allProcessed).toBe(false);
    });

    test('identifies processed uploads even when first upload is still pending (bug regression test)', () => {
        // This is the exact scenario that triggered the original bug:
        // First upload is pending, but subsequent ones are processed.
        // The old code would return early and never mark the others as processed.
        const uploads = [
            createUpload('/2024/01-01/still_pending.jpg', UploadState.PROCESSING, 'v1'),
            createUpload('/2024/01-01/already_done.jpg', UploadState.PROCESSING, 'v2'),
            createUpload('/2024/01-01/also_done.jpg', UploadState.PROCESSING, 'v3'),
        ];
        // First image NOT in album yet, but second and third ARE
        const albumVersions: Record<string, string> = {
            '/2024/01-01/already_done.jpg': 'v2',
            '/2024/01-01/also_done.jpg': 'v3',
        };
        const getImageVersionId = (path: string) => albumVersions[path];

        const result = findProcessedUploads(uploads, getImageVersionId);

        // The key assertion: we should find the processed ones even though
        // the first one in the list is still pending
        expect(result.processed).toEqual(['/2024/01-01/already_done.jpg', '/2024/01-01/also_done.jpg']);
        expect(result.allProcessed).toBe(false);
    });

    //
    // HEIC→JPG CONVERSION: The backend converts HEIC files to JPG.
    // The converted JPG has a DIFFERENT versionId than the original HEIC upload,
    // so we check for existence rather than matching versionId.
    //

    test('marks HEIC upload as processed when album has converted JPG (different versionId)', () => {
        // Upload is photo.heic with versionId from S3 upload
        const uploads = [createUpload('/2024/01-01/photo.heic', UploadState.PROCESSING, 'heic-upload-version')];
        // Album has the converted JPG with a DIFFERENT versionId (from the conversion process)
        const getImageVersionId = (path: string) =>
            path === '/2024/01-01/photo.jpg' ? 'jpg-converted-version' : undefined;

        const result = findProcessedUploads(uploads, getImageVersionId);

        expect(result.processed).toEqual(['/2024/01-01/photo.heic']);
        expect(result.allProcessed).toBe(true);
    });

    test('marks HEIF upload as processed when album has converted JPG (different versionId)', () => {
        // Same behavior for .heif extension
        const uploads = [createUpload('/2024/01-01/photo.heif', UploadState.PROCESSING, 'heif-upload-version')];
        const getImageVersionId = (path: string) =>
            path === '/2024/01-01/photo.jpg' ? 'jpg-converted-version' : undefined;

        const result = findProcessedUploads(uploads, getImageVersionId);

        expect(result.processed).toEqual(['/2024/01-01/photo.heif']);
        expect(result.allProcessed).toBe(true);
    });

    test('handles mix of HEIC and JPG uploads correctly', () => {
        const uploads = [
            createUpload('/2024/01-01/photo1.heic', UploadState.PROCESSING, 'heic-v1'),
            createUpload('/2024/01-01/photo2.jpg', UploadState.PROCESSING, 'jpg-v2'),
            createUpload('/2024/01-01/photo3.heif', UploadState.PROCESSING, 'heif-v3'),
        ];
        // Album has converted JPGs for HEIC files (with different versionIds),
        // and direct match for JPG (with same versionId)
        const albumVersions: Record<string, string> = {
            '/2024/01-01/photo1.jpg': 'converted-v1', // Converted from .heic - different versionId
            '/2024/01-01/photo2.jpg': 'jpg-v2', // Direct JPG - same versionId
            '/2024/01-01/photo3.jpg': 'converted-v3', // Converted from .heif - different versionId
        };
        const getImageVersionId = (path: string) => albumVersions[path];

        const result = findProcessedUploads(uploads, getImageVersionId);

        expect(result.processed).toEqual([
            '/2024/01-01/photo1.heic',
            '/2024/01-01/photo2.jpg',
            '/2024/01-01/photo3.heif',
        ]);
        expect(result.allProcessed).toBe(true);
    });

    //
    // HEIC REPLACEMENT: When replacing a JPG with a HEIC, we need to detect
    // when the versionId changes from the previous value (not just exists).
    //

    test('marks HEIC replacement as pending when album still has old versionId', () => {
        // Replacing cow_portrait.jpg with a HEIC - upload goes to cow_portrait.heic
        // The previousVersionId is the old JPG's versionId
        const uploads = [
            createUpload(
                '/2024/01-01/cow_portrait.heic',
                UploadState.PROCESSING,
                'heic-upload-version',
                'old-jpg-version', // previousVersionId - the JPG we're replacing
            ),
        ];
        // Album still has the old JPG (server hasn't processed the HEIC yet)
        const getImageVersionId = (path: string) =>
            path === '/2024/01-01/cow_portrait.jpg' ? 'old-jpg-version' : undefined;

        const result = findProcessedUploads(uploads, getImageVersionId);

        // Should NOT be processed yet - versionId hasn't changed
        expect(result.processed).toEqual([]);
        expect(result.allProcessed).toBe(false);
    });

    test('marks HEIC replacement as processed when album has new versionId', () => {
        // Same scenario, but now the server has processed the HEIC and created a new JPG
        const uploads = [
            createUpload(
                '/2024/01-01/cow_portrait.heic',
                UploadState.PROCESSING,
                'heic-upload-version',
                'old-jpg-version', // previousVersionId - the JPG we're replacing
            ),
        ];
        // Album now has the new JPG with a different versionId
        const getImageVersionId = (path: string) =>
            path === '/2024/01-01/cow_portrait.jpg' ? 'new-jpg-version' : undefined;

        const result = findProcessedUploads(uploads, getImageVersionId);

        // Should be processed - versionId changed from old to new
        expect(result.processed).toEqual(['/2024/01-01/cow_portrait.heic']);
        expect(result.allProcessed).toBe(true);
    });

    test('HEIC new upload (not replacement) completes when JPG exists', () => {
        // New HEIC upload (no previousVersionId) - should complete when JPG exists
        const uploads = [createUpload('/2024/01-01/photo.heic', UploadState.PROCESSING, 'heic-upload-version')];
        const getImageVersionId = (path: string) => (path === '/2024/01-01/photo.jpg' ? 'any-version' : undefined);

        const result = findProcessedUploads(uploads, getImageVersionId);

        expect(result.processed).toEqual(['/2024/01-01/photo.heic']);
        expect(result.allProcessed).toBe(true);
    });
});

describe('getUploadPathForReplacement', () => {
    test('returns same path when extensions match', () => {
        expect(getUploadPathForReplacement('/2024/01-01/photo.jpg', 'new_photo.jpg')).toBe('/2024/01-01/photo.jpg');
    });

    test('replaces JPG extension with HEIC when dropping HEIC onto JPG', () => {
        expect(getUploadPathForReplacement('/2024/01-01/photo.jpg', 'new_photo.heic')).toBe('/2024/01-01/photo.heic');
    });

    test('replaces JPG extension with HEIF when dropping HEIF onto JPG', () => {
        expect(getUploadPathForReplacement('/2024/01-01/photo.jpg', 'new_photo.heif')).toBe('/2024/01-01/photo.heif');
    });

    test('replaces PNG extension with JPG when dropping JPG onto PNG', () => {
        expect(getUploadPathForReplacement('/2024/01-01/photo.png', 'new_photo.jpg')).toBe('/2024/01-01/photo.jpg');
    });

    test('handles uppercase extensions in source file', () => {
        expect(getUploadPathForReplacement('/2024/01-01/photo.jpg', 'new_photo.HEIC')).toBe('/2024/01-01/photo.heic');
    });

    test('handles uppercase extensions in target path', () => {
        expect(getUploadPathForReplacement('/2024/01-01/photo.JPG', 'new_photo.heic')).toBe('/2024/01-01/photo.heic');
    });
});
