/**
 * Test suite for AlbumLoadMachine
 * Tests the state machine that handles loading album data from both IndexedDB and the server.
 * Verifies correct state transitions and error handling for various scenarios.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, type Mock } from 'vitest';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { albumState } from '../AlbumState.svelte';
import { AlbumStatus, ReloadStatus } from '$lib/models/album';
import { get as getFromIdb, set as setToIdb, del as delFromIdb } from 'idb-keyval';
import { createMockAlbumRecordFromPath } from './albumTestUtils';
import toAlbum from '$lib/models/impl/AlbumCreator';
import type { AlbumRecord } from '$lib/models/impl/server';

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
}));

describe('AlbumLoadMachine', () => {
    const mockFetch = vi.fn();
    const TEST_TIMEOUT = 1000; // 1 second timeout for async operations

    beforeAll(() => {
        vi.stubGlobal('fetch', mockFetch);
    });

    beforeEach(() => {
        vi.clearAllMocks();
        albumState.albums.clear();
        albumState.albumReloads.clear();
    });

    /**
     * Helper function to verify that fetch was called with a URL containing the given path
     * @param path - The path that should be included in the fetch URL
     */
    function expectFetchCalledWithPath(path: string) {
        expect(mockFetch).toHaveBeenCalled();
        expect(mockFetch.mock.calls.some((call) => call[0].includes(path))).toBe(true);
    }

    /**
     * Helper function to verify an album's status
     * @param path - The album path to check
     * @param expectedStatus - The expected AlbumStatus
     */
    function expectAlbumStatus(path: string, expectedStatus: AlbumStatus) {
        expect(albumState.albums.get(path)?.status).toBe(expectedStatus);
    }

    /**
     * Helper function to mock successful IDB retrieval
     * @param album - The album record to return from IDB, or undefined if not found
     */
    function mockIdbSuccess(album: AlbumRecord | undefined) {
        vi.mocked(getFromIdb).mockResolvedValueOnce(album);
    }

    /**
     * Helper function to mock successful album fetch from server
     * @param album - The album record to return from the server
     */
    function mockAlbumFetchSuccess(album: AlbumRecord) {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(album),
        });
    }

    /**
     * Helper function to mock 404 Not Found response from server
     */
    function mockAlbumFetchNotFound() {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'Not found' }),
        });
    }

    /**
     * Helper function to mock server error response
     * @param delay - Optional delay in milliseconds before resolving
     */
    function mockAlbumFetchFail(delay = 0) {
        if (delay > 0) {
            return mockFetch.mockImplementation(
                () =>
                    new Promise((resolve) =>
                        setTimeout(
                            () =>
                                resolve({
                                    ok: false,
                                    status: 500,
                                    json: () => Promise.resolve({ error: 'Server error' }),
                                }),
                            delay,
                        ),
                    ),
            );
        }
        return mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Server error' }),
        });
    }

    describe('fetch', () => {
        it('should go NOT_LOADED > LOADING > LOADED when album found in both IDB and server', async () => {
            // Arrange: Set up test data and mocks
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(mockAlbum);
            mockAlbumFetchSuccess(mockAlbum);

            // Act: Trigger the state transition
            albumLoadMachine.fetch(albumPath);

            // Assert: Verify initial loading state
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.LOADED);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Assert: Verify final state and side effects
            const loadedAlbum = albumState.albums.get(albumPath)?.album;
            expect(loadedAlbum).toBeDefined();
            expect(loadedAlbum?.path).toBe(albumPath);
            expect(loadedAlbum?.title).toBe('January 1, 2024');

            // Verify API calls were made
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
        });

        it('should go NOT_LOADED > LOADING > LOADED when album not in IDB but found on server', async () => {
            // Arrange: Set up test data and mocks
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(undefined);
            mockAlbumFetchSuccess(mockAlbum);

            // Act: Trigger the state transition
            albumLoadMachine.fetch(albumPath);

            // Assert: Verify initial loading state
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.LOADED);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Assert: Verify final state and side effects
            const loadedAlbum = albumState.albums.get(albumPath)?.album;
            expect(loadedAlbum).toBeDefined();
            expect(loadedAlbum?.path).toBe(albumPath);
            expect(loadedAlbum?.title).toBe('January 1, 2024');

            // Verify API calls and IDB updates
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
            expect(vi.mocked(setToIdb)).toHaveBeenCalledWith(albumPath, mockAlbum);
        });

        it('should go NOT_LOADED > LOADING > LOADED > DOES_NOT_EXIST when album found in IDB but not on server', async () => {
            // Arrange: Set up test data and mocks
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(mockAlbum);
            mockAlbumFetchNotFound();

            // Act: Trigger the state transition
            albumLoadMachine.fetch(albumPath);

            // Assert: Verify initial loading state
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.DOES_NOT_EXIST);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Assert: Verify final state and side effects
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
            expect(vi.mocked(delFromIdb)).toHaveBeenCalledWith(albumPath);
        });

        it('should keep IDB data when server returns 500', async () => {
            // Arrange: Set up test data and mocks
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(mockAlbum);
            mockAlbumFetchFail(100);

            // Act: Trigger the state transition
            albumLoadMachine.fetch(albumPath);

            // Assert: Verify initial loading state
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);

            // Wait: For IDB fetch to complete
            await vi.waitFor(
                () => {
                    return (getFromIdb as Mock).mock.calls.length > 0;
                },
                { timeout: TEST_TIMEOUT },
            );

            // Assert: Verify we go to LOADED after IDB fetch
            expectAlbumStatus(albumPath, AlbumStatus.LOADED);
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);

            // Wait: For server fetch to complete
            await vi.waitFor(
                () => {
                    return mockFetch.mock.calls.length > 0;
                },
                { timeout: TEST_TIMEOUT },
            );

            // Assert: Verify we remain in LOADED after server error
            expectAlbumStatus(albumPath, AlbumStatus.LOADED);
            expectFetchCalledWithPath(albumPath);
            expect(vi.mocked(delFromIdb)).not.toHaveBeenCalledWith(albumPath);
        });

        it('should go NOT_LOADED > LOADING > LOAD_ERRORED when album not in IDB and server returns 500', async () => {
            // Arrange: Set up test data and mocks
            const albumPath = '/2024/01-01/';
            mockIdbSuccess(undefined);
            mockAlbumFetchFail();

            // Act: Trigger the state transition
            albumLoadMachine.fetch(albumPath);

            // Assert: Verify initial loading state
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.LOAD_ERRORED);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Assert: Verify final state and side effects
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
            expect(vi.mocked(setToIdb)).not.toHaveBeenCalled();
            expect(vi.mocked(delFromIdb)).not.toHaveBeenCalled();
        });

        it('should throw error for invalid album path', () => {
            // Arrange: Set up invalid input
            const invalidPath = 'invalid-path';

            // Act & Assert: Verify error is thrown
            expect(() => {
                albumLoadMachine.fetch(invalidPath);
            }).toThrow(`Invalid album path [${invalidPath}]`);
        });

        it('should do nothing if album is already loading', () => {
            // Arrange: Set up album in loading state
            const albumPath = '/2024/01-01/';
            albumState.albums.set(albumPath, { status: AlbumStatus.LOADING });

            // Act: Attempt to fetch again
            albumLoadMachine.fetch(albumPath);

            // Assert: Verify no additional API calls were made
            expect(getFromIdb).not.toHaveBeenCalled();
            expect(mockFetch).not.toHaveBeenCalled();

            // Verify state remains unchanged
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);
        });

        it('should do nothing if album is already reloading', () => {
            // Arrange: Set up album in reloading state
            const albumPath = '/2024/01-01/';
            albumState.albumReloads.set(albumPath, ReloadStatus.RELOADING);

            // Act: Attempt to fetch again
            albumLoadMachine.fetch(albumPath);

            // Assert: Verify no additional API calls were made
            expect(getFromIdb).not.toHaveBeenCalled();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should refetch from server when album is already loaded and refetch=true', async () => {
            // Arrange: Set up album in loaded state and mocks
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            albumState.albums.set(albumPath, {
                status: AlbumStatus.LOADED,
                album: toAlbum(mockAlbum),
            });
            mockAlbumFetchSuccess(mockAlbum);

            // Act: Trigger refetch
            albumLoadMachine.fetch(albumPath, true); // refetch = true

            // Assert: Verify reloading state is set
            expect(albumState.albumReloads.get(albumPath)).toBe(ReloadStatus.RELOADING);

            // Wait: For server fetch to be called
            await vi.waitFor(
                () => {
                    expectFetchCalledWithPath(albumPath);
                },
                { timeout: TEST_TIMEOUT },
            );
        });

        it('should not refetch when album is loaded and refetch=false', () => {
            // Arrange: Set up album in loaded state
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            albumState.albums.set(albumPath, {
                status: AlbumStatus.LOADED,
                album: toAlbum(mockAlbum),
            });

            // Act: Attempt to fetch with refetch=false
            albumLoadMachine.fetch(albumPath, false); // refetch = false

            // Assert: Verify no reloading state is set
            expect(albumState.albumReloads.get(albumPath)).toBeUndefined();

            // Verify no server fetch was called
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('albumExists', () => {
        it('should return true when album exists in memory with LOADED status', async () => {
            // Arrange: Set up album in loaded state
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            albumState.albums.set(albumPath, {
                status: AlbumStatus.LOADED,
                album: toAlbum(mockAlbum),
            });

            // Act: Check if album exists
            const exists = await albumLoadMachine.albumExists(albumPath);

            // Assert: Verify result
            expect(exists).toBe(true);
        });

        it('should return true when album exists in memory with LOADING status', async () => {
            // Arrange: Set up album in loading state
            const albumPath = '/2024/01-01/';
            albumState.albums.set(albumPath, {
                status: AlbumStatus.LOADING,
            });

            // Act: Check if album exists
            const exists = await albumLoadMachine.albumExists(albumPath);

            // Assert: Verify result
            expect(exists).toBe(true);
        });

        it('should return false when album exists in memory with DOES_NOT_EXIST status', async () => {
            // Arrange: Set up album in does-not-exist state
            const albumPath = '/2024/01-01/';
            albumState.albums.set(albumPath, {
                status: AlbumStatus.DOES_NOT_EXIST,
            });

            // Act: Check if album exists
            const exists = await albumLoadMachine.albumExists(albumPath);

            // Assert: Verify result
            expect(exists).toBe(false);
        });

        it('should return true when album exists on disk but not in memory', async () => {
            // Arrange: Set up mock for disk storage
            const albumPath = '/2024/01-01/';
            const mockAlbum = createMockAlbumRecordFromPath(albumPath);
            mockIdbSuccess(mockAlbum);

            // Act: Check if album exists
            const exists = await albumLoadMachine.albumExists(albumPath);

            // Assert: Verify result and API calls
            expect(exists).toBe(true);
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
        });

        it('should return false when album not found on disk or server', async () => {
            // Arrange: Set up mocks for not found scenario
            const albumPath = '/2024/01-01/';
            mockIdbSuccess(undefined);
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            // Act: Check if album exists
            const exists = await albumLoadMachine.albumExists(albumPath);

            // Assert: Verify result and API calls
            expect(exists).toBe(false);
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
        });

        it('should return true when album exists on server', async () => {
            // Arrange: Set up mocks for server success
            const albumPath = '/2024/01-01/';
            mockIdbSuccess(undefined);
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
            });

            // Act: Check if album exists
            const exists = await albumLoadMachine.albumExists(albumPath);

            // Assert: Verify result and API calls
            expect(exists).toBe(true);
            expect(getFromIdb).toHaveBeenCalledWith(albumPath);
            expectFetchCalledWithPath(albumPath);
        });

        it('should throw error for invalid album path', async () => {
            // Arrange: Set up invalid input
            const invalidPath = 'invalid-path';

            // Act & Assert: Verify error is thrown
            await expect(albumLoadMachine.albumExists(invalidPath)).rejects.toThrow(
                `Invalid album path [${invalidPath}]`,
            );
        });

        it('should throw error for unexpected server response', async () => {
            // Arrange: Set up mock for unexpected server response
            const albumPath = '/2024/01-01/';
            mockIdbSuccess(undefined);
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403, // Forbidden - unexpected status
            });

            // Act & Assert: Verify error is thrown
            await expect(albumLoadMachine.albumExists(albumPath)).rejects.toThrow(
                `Unexpected response [403] fetching album [${albumPath}]`,
            );
        });
    });
});
