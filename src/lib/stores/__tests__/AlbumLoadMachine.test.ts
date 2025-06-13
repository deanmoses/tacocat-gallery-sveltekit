import { describe, it, expect, vi, beforeEach } from 'vitest';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { albumState } from '../AlbumState.svelte';
import { AlbumStatus } from '$lib/models/album';
import { get as getFromIdb, set as setToIdb, del as delFromIdb } from 'idb-keyval';
import { createMockAlbumRecord } from './albumTestUtils';

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
}));

describe('AlbumLoadMachine', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        albumState.albums.clear();
        albumState.albumReloads.clear();
        vi.stubGlobal('fetch', mockFetch);
    });

    describe('fetch', () => {
        it('should go NOT_LOADED > LOADING > LOADED when album exists on disk', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbumRecord = createMockAlbumRecord({
                path: albumPath
            });
            // Mock idb-keyval to return an AlbumRecord
            (getFromIdb as any).mockResolvedValue(mockAlbumRecord);
            // Mock fetch to return a successful response
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockAlbumRecord)
            });
            // Act
            albumLoadMachine.fetch(albumPath);
            // Assert - Check initial state transition to LOADING
            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADING);
            // Wait for async operations to complete
            await vi.waitFor(() => {
                expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADED);
            });
            // Verify the album was loaded correctly
            expect(albumState.albums.get(albumPath)?.album).toBeDefined();
            expect(albumState.albums.get(albumPath)?.album?.path).toBe(albumPath);
            expect(albumState.albums.get(albumPath)?.album?.title).toBe('January 1, 2024'); // AlbumDayImpl will use the date
            // Verify idb-keyval was called
            expect(getFromIdb).toHaveBeenCalled();
            // Verify fetch was called
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should go NOT_LOADED > LOADING > LOADED when album not in IDB but found on server', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbumRecord = createMockAlbumRecord({
                path: albumPath
            });
            // Mock idb-keyval to return undefined (not found)
            (getFromIdb as any).mockResolvedValue(undefined);
            // Mock fetch to return a successful response
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockAlbumRecord)
            });
            // Act
            albumLoadMachine.fetch(albumPath);
            // Assert - Check initial state transition to LOADING
            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADING);
            // Wait for async operations to complete
            await vi.waitFor(() => {
                expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADED);
            });
            // Verify the album was loaded correctly
            expect(albumState.albums.get(albumPath)?.album).toBeDefined();
            expect(albumState.albums.get(albumPath)?.album?.path).toBe(albumPath);
            expect(albumState.albums.get(albumPath)?.album?.title).toBe('January 1, 2024'); // AlbumDayImpl will use the date
            // Verify idb-keyval was called
            expect(getFromIdb).toHaveBeenCalled();
            // Verify fetch was called
            expect(mockFetch).toHaveBeenCalled();
            // Verify the album was stored in IDB
            expect(vi.mocked(setToIdb)).toHaveBeenCalledWith(albumPath, mockAlbumRecord);
        });

        it('should go NOT_LOADED > LOADING > LOADED > DOES_NOT_EXIST when album found in IDB but not on server', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbumRecord = createMockAlbumRecord({
                path: albumPath
            });
            // Mock idb-keyval to return an AlbumRecord
            (getFromIdb as any).mockResolvedValue(mockAlbumRecord);
            // Mock fetch to return 404
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                json: () => Promise.resolve({ error: 'Not found' })
            });
            // Act
            albumLoadMachine.fetch(albumPath);
            // Assert - Check initial state transition to LOADING
            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADING);
            // Wait for async operations to complete
            await vi.waitFor(() => {
                expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.DOES_NOT_EXIST);
            });
            // Verify idb-keyval was called
            expect(getFromIdb).toHaveBeenCalled();
            // Verify fetch was called
            expect(mockFetch).toHaveBeenCalled();
            // Verify the album was removed from IDB
            expect(vi.mocked(delFromIdb)).toHaveBeenCalledWith(albumPath);
        });

        it('should go NOT_LOADED > LOADING > LOADED when album found in IDB but 500 on server', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbumRecord = createMockAlbumRecord({
                path: albumPath
            });
            (getFromIdb as any).mockResolvedValue(mockAlbumRecord);
            // Add a delay to the fetch mock
            mockFetch.mockImplementation(() =>
                new Promise((resolve) => setTimeout(() => resolve({
                    ok: false,
                    status: 500,
                    json: () => Promise.resolve({ error: 'Server error' })
                }), 100))
            );
            albumLoadMachine.fetch(albumPath);

            // First transition: NOT_LOADED > LOADING
            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADING);

            // Second transition: LOADING > LOADED (after finding in IDB)
            await vi.waitFor(() => {
                expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADED);
            });

            // State should remain LOADED even after server error
            await vi.waitFor(() => {
                expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADED);
            });

            expect(getFromIdb).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalled();
            expect(vi.mocked(delFromIdb)).not.toHaveBeenCalledWith(albumPath);
        });

        it('should go NOT_LOADED > LOADING > LOAD_ERRORED when album not in IDB and 500 on server', async () => {
            const albumPath = '/2024/01-01/';
            // Mock idb-keyval to return undefined (not found)
            (getFromIdb as any).mockResolvedValue(undefined);
            // Mock fetch to return a 500 error
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ error: 'Server error' })
            });
            // Act
            albumLoadMachine.fetch(albumPath);
            // Assert - Check initial state transition to LOADING
            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADING);
            // Wait for async operations to complete
            await vi.waitFor(() => {
                expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOAD_ERRORED);
            });
            // Verify idb-keyval was called
            expect(getFromIdb).toHaveBeenCalled();
            // Verify fetch was called
            expect(mockFetch).toHaveBeenCalled();
            // Should not store or delete anything in IDB
            expect(vi.mocked(setToIdb)).not.toHaveBeenCalled();
            expect(vi.mocked(delFromIdb)).not.toHaveBeenCalled();
        });
    });
});
