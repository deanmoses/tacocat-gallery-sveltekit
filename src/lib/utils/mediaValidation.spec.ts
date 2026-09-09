import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateMediaBatch, createPreviewUrl } from './mediaValidation';
import type { MediaItemToUpload } from '$lib/models/album';

/**
 * A filename containing this decodes as a broken image.
 *
 * Nothing available to a unit test decodes image bytes -- Node has no Image at
 * all, and jsdom and happy-dom supply the element but never fire load or error
 * for real content -- so the outcome has to be scripted either way. Keying it
 * off the filename puts that decision in the fixture, where a reader can see
 * which files are meant to be broken, instead of inside the stub.
 */
const CORRUPT = 'corrupt';

/** Object URLs handed out during the current test, in creation order */
let createdUrls: string[];

/** Object URLs released during the current test */
let revokedUrls: string[];

/** Object URLs an <img> was actually pointed at, so tests can assert a decode was skipped */
let decodeAttempts: string[];

/** Stands in for the browser's Image element, which no test environment implements */
class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(url: string) {
        decodeAttempts.push(url);
        const handler = url.includes(CORRUPT) ? () => this.onerror?.() : () => this.onload?.();

        // Browsers decode asynchronously, so a caller must not assume the
        // handler has run by the time the assignment returns
        setTimeout(handler, 0);
    }
}

function mediaItem(name: string, sizeInBytes = 100): MediaItemToUpload {
    return {
        file: new File([new Uint8Array(sizeInBytes)], name, { type: 'image/jpeg' }),
        uploadPath: `/2024/01-01/${name}`,
    };
}

describe('mediaValidation', () => {
    beforeEach(() => {
        createdUrls = [];
        revokedUrls = [];
        decodeAttempts = [];

        // The module only ever creates an object URL for the File it was
        // handed, so the stub can name the URL after it and let FakeImage
        // decide the outcome from that name
        vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => {
            const url = `blob:${(file as File).name}`;
            createdUrls.push(url);
            return url;
        });
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => {
            revokedUrls.push(url);
        });
        vi.stubGlobal('Image', FakeImage);
    });

    describe(validateMediaBatch, () => {
        it('accepts a file that decodes', async () => {
            const result = await validateMediaBatch([mediaItem('valid.jpg')]);

            expect(result.valid.map((item) => item.uploadPath)).toStrictEqual(['/2024/01-01/valid.jpg']);
            expect(result.invalid).toStrictEqual([]);
        });

        // A file can be the right size and the right extension and still be
        // truncated or garbled, which is the case this module exists to catch
        it('rejects a file that does not decode', async () => {
            const result = await validateMediaBatch([mediaItem('corrupt.jpg')]);

            expect(result.valid).toStrictEqual([]);
            expect(result.invalid).toStrictEqual(['/2024/01-01/corrupt.jpg']);
        });

        it('rejects a zero-byte file without trying to decode it', async () => {
            const result = await validateMediaBatch([mediaItem('empty.jpg', 0)]);

            expect(result.invalid).toStrictEqual(['/2024/01-01/empty.jpg']);
            expect(decodeAttempts).toStrictEqual([]);
            expect(createdUrls).toStrictEqual([]);
        });

        // The server converts these, and the browser cannot open them to check,
        // so they are taken on trust rather than failed for being unreadable
        it.each(['photo.heic', 'photo.heif', 'video.mp4'])('accepts %s without trying to decode it', async (name) => {
            const result = await validateMediaBatch([mediaItem(name)]);

            expect(result.valid).toHaveLength(1);
            expect(decodeAttempts).toStrictEqual([]);
        });

        it('still rejects a zero-byte file the browser cannot decode', async () => {
            const result = await validateMediaBatch([mediaItem('empty.heic', 0)]);

            expect(result.valid).toStrictEqual([]);
            expect(result.invalid).toStrictEqual(['/2024/01-01/empty.heic']);
        });

        it('splits a mixed batch and keeps the valid ones in their original order', async () => {
            const batch = [
                mediaItem('good1.jpg'),
                mediaItem('empty.jpg', 0),
                mediaItem('corrupt.jpg'),
                mediaItem('photo.heic'),
                mediaItem('good2.jpg'),
            ];

            const result = await validateMediaBatch(batch);

            expect(result.valid.map((item) => item.uploadPath)).toStrictEqual([
                '/2024/01-01/good1.jpg',
                '/2024/01-01/photo.heic',
                '/2024/01-01/good2.jpg',
            ]);
            expect(result.invalid).toStrictEqual(['/2024/01-01/empty.jpg', '/2024/01-01/corrupt.jpg']);
        });

        // An upload batch can be hundreds of photos, so a leaked object URL
        // pins that many decoded images in memory
        it('releases every object URL it creates, on both outcomes', async () => {
            await validateMediaBatch([mediaItem('good.jpg'), mediaItem('corrupt.jpg')]);

            expect(createdUrls).toStrictEqual(['blob:good.jpg', 'blob:corrupt.jpg']);
            expect(revokedUrls).toStrictEqual(createdUrls);
        });

        it('returns empty results for an empty batch', async () => {
            const result = await validateMediaBatch([]);

            expect(result.valid).toStrictEqual([]);
            expect(result.invalid).toStrictEqual([]);
        });
    });

    describe(createPreviewUrl, () => {
        it('returns an object URL for a format the browser renders, without decoding it first', async () => {
            const url = await createPreviewUrl(new File(['x'], 'photo.jpg'));

            expect(url).toBe('blob:photo.jpg');
            expect(decodeAttempts).toStrictEqual([]);
            expect(revokedUrls).toStrictEqual([]);
        });

        // Safari renders HEIC, so the file is offered to the browser rather
        // than assumed unusable
        it('returns an object URL for a format the browser turns out to render', async () => {
            const url = await createPreviewUrl(new File(['x'], 'photo.heic'));

            expect(url).toBe('blob:photo.heic');
            expect(decodeAttempts).toStrictEqual(['blob:photo.heic']);
            expect(revokedUrls).toStrictEqual([]);
        });

        // The caller renders no thumbnail rather than a broken one, and the URL
        // must not be left holding the file
        it.each(['corrupt.heic', 'corrupt.mp4'])(
            'returns no URL for %s, which the browser cannot render',
            async (name) => {
                const url = await createPreviewUrl(new File(['x'], name));

                expect(url).toBe('');
                expect(revokedUrls).toStrictEqual([`blob:${name}`]);
            },
        );
    });
});
