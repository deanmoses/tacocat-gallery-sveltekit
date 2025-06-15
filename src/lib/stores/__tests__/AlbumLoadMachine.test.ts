import { describe, it, expect, vi, beforeEach } from 'vitest';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { albumState } from '../AlbumState.svelte';
import { AlbumStatus } from '$lib/models/album';
import { get as getFromIdb, set as setToIdb, del as delFromIdb } from 'idb-keyval';
import { createMockAlbumRecordFromPath } from './albumTestUtils';

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

    // Helper functions

    function mockIdbSuccess(album: any) {
        vi.mocked(getFromIdb).mockResolvedValueOnce(album);
    }

    function mockAlbumFetchSuccess(album: any) {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(album)
        });
    }

    function mockAlbumFetchNotFound() {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'Not found' })
        });
    }

    function mockAlbumFetchFail(delay = 0) {
        if (delay > 0) {
            return mockFetch.mockImplementation(() =>
                new Promise((resolve) => setTimeout(() => resolve({
                    ok: false,
                    status: 500,
                    json: () => Promise.resolve({ error: 'Server error' })
                }), delay))
            );
        } else {
            return mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ error: 'Server error' })
            });
        }
    }

    describe('fetch', () => {
        it('should go NOT_LOADED > LOADING > LOADED when album exists on disk', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(mockAlbum);
            mockAlbumFetchSuccess(mockAlbum);

            albumLoadMachine.fetch(albumPath);

            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADING);
            await vi.waitFor(() => {
                expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADED);
            });
            expect(albumState.albums.get(albumPath)?.album).toBeDefined();
            expect(albumState.albums.get(albumPath)?.album?.path).toBe(albumPath);
            expect(albumState.albums.get(albumPath)?.album?.title).toBe('January 1, 2024');
            expect(getFromIdb).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should go NOT_LOADED > LOADING > LOADED when album not in IDB but found on server', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(undefined);
            mockAlbumFetchSuccess(mockAlbum);

            albumLoadMachine.fetch(albumPath);

            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADING);
            await vi.waitFor(() => {
                expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADED);
            });
            expect(albumState.albums.get(albumPath)?.album).toBeDefined();
            expect(albumState.albums.get(albumPath)?.album?.path).toBe(albumPath);
            expect(albumState.albums.get(albumPath)?.album?.title).toBe('January 1, 2024');
            expect(getFromIdb).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalled();
            expect(vi.mocked(setToIdb)).toHaveBeenCalledWith(albumPath, mockAlbum);
        });

        it('should go NOT_LOADED > LOADING > LOADED > DOES_NOT_EXIST when album found in IDB but not on server', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(mockAlbum);
            mockAlbumFetchNotFound();

            albumLoadMachine.fetch(albumPath);

            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADING);
            await vi.waitFor(() => {
                expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.DOES_NOT_EXIST);
            });
            expect(getFromIdb).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalled();
            expect(vi.mocked(delFromIdb)).toHaveBeenCalledWith(albumPath);
        });

        it('should go NOT_LOADED > LOADING > LOADED when album found in IDB but 500 on server', async () => {
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(mockAlbum);
            mockAlbumFetchFail(100);

            albumLoadMachine.fetch(albumPath);

            // Verify we go to LOADING
            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADING);

            // Wait for IDB fetch to complete
            await vi.waitFor(() => {
                return (getFromIdb as any).mock.calls.length > 0;
            });

            // Verify we go to LOADED after IDB fetch
            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADED);
            expect(getFromIdb).toHaveBeenCalled();

            // Wait for server fetch to complete
            await vi.waitFor(() => {
                return mockFetch.mock.calls.length > 0;
            }, { timeout: 200 });

            // Verify we remain in LOADED after server error
            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADED);
            expect(mockFetch).toHaveBeenCalled();
            expect(vi.mocked(delFromIdb)).not.toHaveBeenCalledWith(albumPath);
        });

        it('should go NOT_LOADED > LOADING > LOAD_ERRORED when album not in IDB and 500 on server', async () => {
            const albumPath = '/2024/01-01/';
            mockIdbSuccess(undefined);
            mockAlbumFetchFail();

            albumLoadMachine.fetch(albumPath);

            expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOADING);
            await vi.waitFor(() => {
                expect(albumState.albums.get(albumPath)?.status).toBe(AlbumStatus.LOAD_ERRORED);
            });
            expect(getFromIdb).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalled();
            expect(vi.mocked(setToIdb)).not.toHaveBeenCalled();
            expect(vi.mocked(delFromIdb)).not.toHaveBeenCalled();
        });
    });
});