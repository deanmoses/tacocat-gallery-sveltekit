/**
 * Integration tests for immer's produce() function.
 *
 * These tests verify that our usage patterns work correctly after package bumps.
 * They don't test immer's API - they test that our code's integration with immer
 * produces the expected results.
 */
import { test, expect, describe } from 'vitest';
import { produce } from 'immer';
import type { Draft } from '$lib/models/draft';
import { DraftStatus } from '$lib/models/draft';

describe('immer produce() integration', () => {
    test('updating nested object preserves other properties', () => {
        const original: Draft = {
            path: '/2024/01-15/',
            status: DraftStatus.NO_CHANGES,
            content: {
                title: 'Original Title',
                description: 'Original Description',
            },
        };

        const updated = produce(original, (draft) => {
            if (draft.content) {
                draft.content.title = 'New Title';
            }
            draft.status = DraftStatus.UNSAVED_CHANGES;
        });

        // Original should be unchanged
        expect(original.content?.title).toBe('Original Title');
        expect(original.status).toBe(DraftStatus.NO_CHANGES);

        // Updated should have new values
        expect(updated.content?.title).toBe('New Title');
        expect(updated.status).toBe(DraftStatus.UNSAVED_CHANGES);

        // Other properties should be preserved
        expect(updated.path).toBe('/2024/01-15/');
        expect(updated.content?.description).toBe('Original Description');
    });

    test('adding new properties to nested object', () => {
        const original: Draft = {
            path: '/2024/',
            status: DraftStatus.NO_CHANGES,
            content: {},
        };

        const updated = produce(original, (draft) => {
            if (draft.content) {
                draft.content.title = 'New Title';
                draft.content.summary = 'New Summary';
                draft.content.published = true;
            }
        });

        expect(original.content?.title).toBeUndefined();
        expect(updated.content?.title).toBe('New Title');
        expect(updated.content?.summary).toBe('New Summary');
        expect(updated.content?.published).toBe(true);
    });

    test('produces distinct object references when nested content changes', () => {
        const original: Draft = {
            path: '/2024/',
            status: DraftStatus.NO_CHANGES,
            content: { title: 'Test' },
        };

        const updated = produce(original, (draft) => {
            draft.status = DraftStatus.UNSAVED_CHANGES;
            if (draft.content) draft.content.title = 'Changed';
        });

        // Root object always gets new reference
        expect(updated).not.toBe(original);
        // When nested object is modified, it gets new reference too
        expect(updated.content).not.toBe(original.content);
        // Original nested content unchanged
        expect(original.content?.title).toBe('Test');
    });

    test('handles deeply nested updates', () => {
        // Simulates AlbumEntry structure with nested album data
        type AlbumEntry = {
            loadStatus: string;
            album?: {
                path: string;
                media: Array<{ path: string; title?: string }>;
            };
        };

        const original: AlbumEntry = {
            loadStatus: 'LOADED',
            album: {
                path: '/2024/01-15/',
                media: [
                    { path: '/2024/01-15/photo1.jpg', title: 'Photo 1' },
                    { path: '/2024/01-15/photo2.jpg', title: 'Photo 2' },
                ],
            },
        };

        const updated = produce(original, (draft) => {
            const image = draft.album?.media.find((img) => img.path === '/2024/01-15/photo1.jpg');
            if (image) {
                image.title = 'Updated Photo 1';
            }
        });

        // Original unchanged
        expect(original.album?.media[0].title).toBe('Photo 1');

        // Updated has new value
        expect(updated.album?.media[0].title).toBe('Updated Photo 1');

        // Other items unchanged
        expect(updated.album?.media[1].title).toBe('Photo 2');
    });

    test('sequential produce calls accumulate changes correctly', () => {
        let state: Draft = {
            path: '/2024/',
            status: DraftStatus.NO_CHANGES,
            content: {},
        };

        // Simulate multiple setTitle/setDescription calls
        state = produce(state, (draft) => {
            draft.status = DraftStatus.UNSAVED_CHANGES;
            if (draft.content) draft.content.title = 'Title';
        });

        state = produce(state, (draft) => {
            if (draft.content) draft.content.description = 'Description';
        });

        state = produce(state, (draft) => {
            if (draft.content) draft.content.published = false;
        });

        expect(state.content?.title).toBe('Title');
        expect(state.content?.description).toBe('Description');
        expect(state.content?.published).toBe(false);
        expect(state.status).toBe(DraftStatus.UNSAVED_CHANGES);
    });
});
