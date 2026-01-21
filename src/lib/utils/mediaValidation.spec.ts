import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { validateMediaBatch } from './mediaValidation';
import type { MediaItemToUpload } from '$lib/models/album';

// Mock browser APIs
beforeAll(() => {
    vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:fake-url'),
        revokeObjectURL: vi.fn(),
    });

    // Mock Image - always succeeds for non-zero files (we can't test actual image parsing in Node)
    vi.stubGlobal(
        'Image',
        class {
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            set src(_url: string) {
                // Simulate async image load success
                setTimeout(() => this.onload?.(), 0);
            }
        },
    );
});

afterAll(() => {
    vi.unstubAllGlobals();
});

function createMockFile(name: string, size: number): File {
    const content = size > 0 ? new Uint8Array(size) : new Uint8Array(0);
    return new File([content], name, { type: 'image/jpeg' });
}

function createImageToUpload(name: string, size: number): MediaItemToUpload {
    return {
        file: createMockFile(name, size),
        uploadPath: `/2024/01-01/${name}`,
    };
}

describe('validateImageBatch', () => {
    it('rejects zero-byte files', async () => {
        const files = [createImageToUpload('empty.jpg', 0)];

        const result = await validateMediaBatch(files);

        expect(result.valid).toHaveLength(0);
        expect(result.invalid).toEqual(['/2024/01-01/empty.jpg']);
    });

    it('accepts non-zero files', async () => {
        const files = [createImageToUpload('valid.jpg', 100)];

        const result = await validateMediaBatch(files);

        expect(result.valid).toHaveLength(1);
        expect(result.invalid).toHaveLength(0);
    });

    it('filters zero-byte files from mixed batch', async () => {
        const files = [
            createImageToUpload('valid1.jpg', 100),
            createImageToUpload('empty.jpg', 0),
            createImageToUpload('valid2.jpg', 200),
        ];

        const result = await validateMediaBatch(files);

        expect(result.valid).toHaveLength(2);
        expect(result.valid.map((f) => f.uploadPath)).toEqual(['/2024/01-01/valid1.jpg', '/2024/01-01/valid2.jpg']);
        expect(result.invalid).toEqual(['/2024/01-01/empty.jpg']);
    });

    it('returns empty arrays for empty input', async () => {
        const result = await validateMediaBatch([]);

        expect(result.valid).toHaveLength(0);
        expect(result.invalid).toHaveLength(0);
    });

    it('accepts HEIC files without content validation (skips Image load)', async () => {
        const files = [createImageToUpload('photo.heic', 100)];

        const result = await validateMediaBatch(files);

        expect(result.valid).toHaveLength(1);
        expect(result.invalid).toHaveLength(0);
    });

    it('accepts HEIF files without content validation', async () => {
        const files = [createImageToUpload('photo.heif', 100)];

        const result = await validateMediaBatch(files);

        expect(result.valid).toHaveLength(1);
        expect(result.invalid).toHaveLength(0);
    });

    it('still rejects zero-byte HEIC files', async () => {
        const files = [createImageToUpload('empty.heic', 0)];

        const result = await validateMediaBatch(files);

        expect(result.valid).toHaveLength(0);
        expect(result.invalid).toEqual(['/2024/01-01/empty.heic']);
    });
});
