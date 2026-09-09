import { it, expect, describe } from 'vitest';
import { findProcessedUploads, getReplacementExtensionError, getUploadPathForReplacement } from './uploadUtils';
import { UploadState, type UploadEntry } from '$lib/models/album';
import { getMediaPath } from './fileFormats';

/**
 * Replacing a media item asks two questions of the same pair of paths: whether
 * the new file is allowed to stand in for the old one, and where it uploads to
 * if it is. They share one table so a combination cannot be answered on one
 * question and left unanswered on the other.
 */
type ReplacementCase = {
    /** Path of the media already in the album */
    targetPath: string;
    /** Name of the file being dropped onto it */
    fileName: string;
    /** Message shown to the admin, or undefined when the replacement is allowed */
    error?: string;
    /**
     * Where the replacement uploads to. Stated only for allowed replacements:
     * a rejected one never reaches getUploadPathForReplacement, so pinning a
     * path for it would fix behaviour no caller depends on.
     */
    uploadPath?: string;
};

/** What an admin is told when a JPG is replaced by something the server cannot convert */
const JPG_ERROR = 'Cannot replace: file must be JPG/JPEG or HEIC/HEIF';

const REPLACEMENT_CASES: ReplacementCase[] = [
    // The same format always replaces itself, whatever the format is
    { targetPath: '/2024/01-01/photo.jpg', fileName: 'new.jpg', uploadPath: '/2024/01-01/photo.jpg' },
    { targetPath: '/2024/01-01/image.png', fileName: 'new.png', uploadPath: '/2024/01-01/image.png' },
    { targetPath: '/2024/01-01/video.mp4', fileName: 'new.mp4', uploadPath: '/2024/01-01/video.mp4' },

    // Extensions are compared case-insensitively, on either side
    { targetPath: '/2024/01-01/photo.jpg', fileName: 'new.JPG', uploadPath: '/2024/01-01/photo.jpg' },
    { targetPath: '/2024/01-01/photo.JPG', fileName: 'new.jpg', uploadPath: '/2024/01-01/photo.JPG' },

    // jpg and jpeg name one format. The target path is kept exactly as it is,
    // rather than taking the source's spelling, so the upload lands on the file
    // being replaced instead of creating a second one beside it.
    { targetPath: '/2024/01-01/photo.jpg', fileName: 'new.jpeg', uploadPath: '/2024/01-01/photo.jpg' },
    { targetPath: '/2024/01-01/photo.jpeg', fileName: 'new.jpg', uploadPath: '/2024/01-01/photo.jpeg' },
    { targetPath: '/2024/01-01/photo.jpg', fileName: 'new.JPEG', uploadPath: '/2024/01-01/photo.jpg' },
    { targetPath: '/2024/01-01/photo.JPG', fileName: 'new.jpeg', uploadPath: '/2024/01-01/photo.JPG' },

    // HEIC and HEIF may replace a JPG because the server converts them. Here the
    // upload does take the source extension, lowercased: the server needs to see
    // the format it is being asked to convert.
    { targetPath: '/2024/01-01/photo.jpg', fileName: 'new.heic', uploadPath: '/2024/01-01/photo.heic' },
    { targetPath: '/2024/01-01/photo.jpg', fileName: 'new.heif', uploadPath: '/2024/01-01/photo.heif' },
    { targetPath: '/2024/01-01/photo.jpeg', fileName: 'new.heic', uploadPath: '/2024/01-01/photo.heic' },
    { targetPath: '/2024/01-01/photo.jpeg', fileName: 'new.heif', uploadPath: '/2024/01-01/photo.heif' },
    { targetPath: '/2024/01-01/photo.jpg', fileName: 'new.HEIC', uploadPath: '/2024/01-01/photo.heic' },
    { targetPath: '/2024/01-01/photo.JPG', fileName: 'new.heic', uploadPath: '/2024/01-01/photo.heic' },

    // The conversion runs one way only: a JPG cannot be replaced by anything
    // else, and nothing else can be replaced by a JPG
    { targetPath: '/2024/01-01/photo.jpg', fileName: 'new.png', error: JPG_ERROR },
    { targetPath: '/2024/01-01/photo.jpg', fileName: 'new.mp4', error: JPG_ERROR },
    { targetPath: '/2024/01-01/photo.jpg', fileName: 'new.gif', error: JPG_ERROR },
    { targetPath: '/2024/01-01/image.png', fileName: 'new.jpg', error: 'Cannot replace: file must be .png' },
    { targetPath: '/2024/01-01/video.mp4', fileName: 'new.jpg', error: 'Cannot replace: file must be .mp4' },
    { targetPath: '/2024/01-01/anim.gif', fileName: 'new.png', error: 'Cannot replace: file must be .gif' },
    // HEIC converts to JPG, so a HEIC in the album is a JPG by the time it is
    // there. Replacing one by its own extension is the only case that arises.
    { targetPath: '/2024/01-01/video.mov', fileName: 'new.mp4', error: 'Cannot replace: file must be .mov' },
];

describe(getReplacementExtensionError, () => {
    it.each(REPLACEMENT_CASES)('$fileName onto $targetPath: $error', ({ targetPath, fileName, error }) => {
        expect(getReplacementExtensionError(targetPath, fileName)).toBe(error);
    });
});

describe(getUploadPathForReplacement, () => {
    it.each(REPLACEMENT_CASES.filter((testCase) => !testCase.error))(
        '$fileName onto $targetPath uploads to $uploadPath',
        ({ targetPath, fileName, uploadPath }) => {
            expect(getUploadPathForReplacement(targetPath, fileName)).toBe(uploadPath);
        },
    );
});

/**
 * An upload is finished when the album shows the result of processing it, and
 * how that is recognised depends on whether the server renames the file.
 *
 * mediaPath is derived through getMediaPath rather than being spelled out, so
 * an entry is built the way the app builds one. The album's side of the
 * comparison is stated per row, since that is what the function is reading.
 */
function upload(fields: {
    uploadPath: string;
    status: UploadState;
    versionId?: string;
    previousVersionId?: string;
}): UploadEntry {
    return { file: new File([], 'test.jpg'), mediaPath: getMediaPath(fields.uploadPath), ...fields };
}

type UploadCase = {
    description: string;
    upload: UploadEntry;
    /** versionId the album reports at the upload's mediaPath; undefined means it is not there yet */
    albumVersionId: string | undefined;
    processed: boolean;
};

const UPLOAD_CASES: UploadCase[] = [
    // A file the server stores under the name it arrived with is done when the
    // album carries the very version that was uploaded
    {
        description: 'stored under its own name, album has the uploaded version',
        upload: upload({ uploadPath: '/2024/01-01/photo.jpg', status: UploadState.PROCESSING, versionId: 'v1' }),
        albumVersionId: 'v1',
        processed: true,
    },
    {
        description: 'stored under its own name, album does not have it yet',
        upload: upload({ uploadPath: '/2024/01-01/photo.jpg', status: UploadState.PROCESSING, versionId: 'v1' }),
        albumVersionId: undefined,
        processed: false,
    },
    {
        description: 'stored under its own name, album still has an older version',
        upload: upload({ uploadPath: '/2024/01-01/photo.jpg', status: UploadState.PROCESSING, versionId: 'v1' }),
        albumVersionId: 'v0',
        processed: false,
    },

    // Nothing is complete before it has reached S3, whatever the album says
    {
        description: 'not started',
        upload: upload({ uploadPath: '/2024/01-01/photo.jpg', status: UploadState.UPLOAD_NOT_STARTED }),
        albumVersionId: 'v1',
        processed: false,
    },
    {
        description: 'still uploading',
        upload: upload({ uploadPath: '/2024/01-01/photo.jpg', status: UploadState.UPLOADING }),
        albumVersionId: 'v1',
        processed: false,
    },
    {
        description: 'processing but S3 returned no version',
        upload: upload({ uploadPath: '/2024/01-01/photo.jpg', status: UploadState.PROCESSING }),
        albumVersionId: 'v1',
        processed: false,
    },

    // A file the server renames is looked for at its post-processing path, and
    // its uploaded versionId is the pre-conversion one, so it cannot be matched
    // against the album's. Existence is all there is to go on.
    {
        description: 'HEIC converted to JPG, album has the converted file',
        upload: upload({ uploadPath: '/2024/01-01/photo.heic', status: UploadState.PROCESSING, versionId: 'heic-v1' }),
        albumVersionId: 'converted-v1',
        processed: true,
    },
    {
        description: 'HEIF converted to JPG, album has the converted file',
        upload: upload({ uploadPath: '/2024/01-01/photo.heif', status: UploadState.PROCESSING, versionId: 'heif-v1' }),
        albumVersionId: 'converted-v1',
        processed: true,
    },
    {
        description: 'HEIC converted to JPG, conversion has not landed yet',
        upload: upload({ uploadPath: '/2024/01-01/photo.heic', status: UploadState.PROCESSING, versionId: 'heic-v1' }),
        albumVersionId: undefined,
        processed: false,
    },

    // Replacing a JPG with a HEIC is the case existence alone cannot answer:
    // there is already a JPG at the destination, so the test is whether the
    // version there has changed from the one being replaced.
    {
        description: 'HEIC replacing a JPG, album still shows the JPG being replaced',
        upload: upload({
            uploadPath: '/2024/01-01/photo.heic',
            status: UploadState.PROCESSING,
            versionId: 'heic-v1',
            previousVersionId: 'old-jpg-v1',
        }),
        albumVersionId: 'old-jpg-v1',
        processed: false,
    },
    {
        description: 'HEIC replacing a JPG, album shows a new version',
        upload: upload({
            uploadPath: '/2024/01-01/photo.heic',
            status: UploadState.PROCESSING,
            versionId: 'heic-v1',
            previousVersionId: 'old-jpg-v1',
        }),
        albumVersionId: 'new-jpg-v1',
        processed: true,
    },
    {
        description: 'HEIC replacing a JPG, album has lost the file entirely',
        upload: upload({
            uploadPath: '/2024/01-01/photo.heic',
            status: UploadState.PROCESSING,
            versionId: 'heic-v1',
            previousVersionId: 'old-jpg-v1',
        }),
        albumVersionId: undefined,
        processed: false,
    },
];

/**
 * A one-item batch reports either that item or nothing, so the expected list is
 * derived here rather than in the test body, where a conditional would hide
 * which of the two a row is asserting.
 */
const SINGLE_UPLOAD_CASES = UPLOAD_CASES.map((testCase) => ({
    ...testCase,
    expectedProcessed: testCase.processed ? [testCase.upload.uploadPath] : [],
}));

describe(findProcessedUploads, () => {
    it.each(SINGLE_UPLOAD_CASES)(
        '$description: $processed',
        ({ upload: entry, albumVersionId, processed, expectedProcessed }) => {
            const result = findProcessedUploads([entry], () => albumVersionId);

            expect(result.processed).toStrictEqual(expectedProcessed);
            expect(result.allProcessed).toBe(processed);
        },
    );

    it('reports nothing to do for an empty batch', () => {
        const result = findProcessedUploads([], () => undefined);

        expect(result.processed).toStrictEqual([]);
        expect(result.allProcessed).toBe(true);
    });

    /**
     * The album is polled until allProcessed, so a batch is examined many times
     * with different items finished each time. Every entry has to be considered
     * on every pass: an unfinished one earlier in the list must not stop the
     * finished ones behind it from being reported.
     */
    it('reports the finished uploads that sit behind an unfinished one', () => {
        const uploads = [
            upload({ uploadPath: '/2024/01-01/pending.jpg', status: UploadState.PROCESSING, versionId: 'v1' }),
            upload({ uploadPath: '/2024/01-01/done1.jpg', status: UploadState.PROCESSING, versionId: 'v2' }),
            upload({ uploadPath: '/2024/01-01/done2.jpg', status: UploadState.PROCESSING, versionId: 'v3' }),
        ];
        const album: Record<string, string> = {
            '/2024/01-01/done1.jpg': 'v2',
            '/2024/01-01/done2.jpg': 'v3',
        };

        const result = findProcessedUploads(uploads, (path) => album[path]);

        expect(result.processed).toStrictEqual(['/2024/01-01/done1.jpg', '/2024/01-01/done2.jpg']);
        expect(result.allProcessed).toBe(false);
    });

    it('reports processed uploads in the order they were given, and holds allProcessed until every one is done', () => {
        const uploads = [
            upload({ uploadPath: '/2024/01-01/a.jpg', status: UploadState.PROCESSING, versionId: 'v1' }),
            upload({ uploadPath: '/2024/01-01/b.heic', status: UploadState.PROCESSING, versionId: 'v2' }),
            upload({ uploadPath: '/2024/01-01/c.jpg', status: UploadState.UPLOADING }),
            upload({ uploadPath: '/2024/01-01/d.jpg', status: UploadState.PROCESSING, versionId: 'v4' }),
        ];
        const album: Record<string, string> = {
            '/2024/01-01/a.jpg': 'v1',
            '/2024/01-01/b.jpg': 'converted-v2',
            '/2024/01-01/d.jpg': 'v4',
        };

        const result = findProcessedUploads(uploads, (path) => album[path]);

        expect(result.processed).toStrictEqual(['/2024/01-01/a.jpg', '/2024/01-01/b.heic', '/2024/01-01/d.jpg']);
        expect(result.allProcessed).toBe(false);
    });

    it('reports allProcessed once the whole batch has landed', () => {
        const uploads = [
            upload({ uploadPath: '/2024/01-01/a.jpg', status: UploadState.PROCESSING, versionId: 'v1' }),
            upload({ uploadPath: '/2024/01-01/b.heic', status: UploadState.PROCESSING, versionId: 'v2' }),
        ];
        const album: Record<string, string> = {
            '/2024/01-01/a.jpg': 'v1',
            '/2024/01-01/b.jpg': 'converted-v2',
        };

        const result = findProcessedUploads(uploads, (path) => album[path]);

        expect(result.processed).toStrictEqual(['/2024/01-01/a.jpg', '/2024/01-01/b.heic']);
        expect(result.allProcessed).toBe(true);
    });

    // The function reports the path that was uploaded, not the one the server
    // stored, because that is the key the caller tracks its entries by
    it('reports the upload path rather than the path the server stored', () => {
        const entry = upload({ uploadPath: '/2024/01-01/photo.heic', status: UploadState.PROCESSING, versionId: 'v1' });

        const result = findProcessedUploads([entry], () => 'converted-v1');

        expect(result.processed).toStrictEqual(['/2024/01-01/photo.heic']);
    });
});
