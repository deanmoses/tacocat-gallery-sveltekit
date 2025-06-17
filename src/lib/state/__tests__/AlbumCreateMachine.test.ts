/**
 * Test suite for AlbumCreateMachine
 * Tests the state machine that handles creating new albums.
 * Verifies correct state transitions, error handling, and server integration.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { MockInstance } from 'vitest';
import { albumCreateMachine } from '../admin/AlbumCreateMachine.svelte';
import { albumState } from '../AlbumState.svelte';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { AlbumStatus } from '$lib/models/album';
import { toast } from '@zerodevx/svelte-toast';
import { getParentFromPath } from '$lib/utils/galleryPathUtils';

const mockFetch = vi.fn();
let toastPushSpy: MockInstance;
let fetchFromServerSpy: MockInstance;

beforeAll(() => {
    vi.stubGlobal('fetch', mockFetch);
    toastPushSpy = vi.spyOn(toast, 'push');
    fetchFromServerSpy = vi.spyOn(albumLoadMachine, 'fetchFromServer');
});

describe('AlbumCreateMachine', () => {
    const TEST_TIMEOUT = 1000; // 1 second timeout for async operations

    beforeEach(() => {
        vi.clearAllMocks();
        albumState.albums.clear();
    });

    /**
     * Helper function to verify an album's status
     * @param path - The album path to check
     * @param expectedStatus - The expected AlbumStatus
     */
    function expectAlbumStatus(path: string, expectedStatus: AlbumStatus) {
        expect(albumState.albums.get(path)?.status).toBe(expectedStatus);
    }

    /**
     * Helper function to verify fetch was called with correct parameters
     * @param path - The album path that should be in the URL
     * @param method - Expected HTTP method
     */
    function expectFetchCalledWithPath(path: string, method = 'PUT') {
        expect(mockFetch).toHaveBeenCalled();
        const call = mockFetch.mock.calls.find((call) => call[0].includes(path));
        expect(call).toBeDefined();
        if (call) {
            expect(call[1].method).toBe(method);
            expect(call[1].credentials).toBe('include');
            expect(call[1].headers['Content-Type']).toBe('application/json');
            expect(call[1].headers['Accept']).toBe('application/json');
            expect(call[1].body).toBe('{}');
        }
    }

    /**
     * Helper function to mock successful album creation
     */
    function mockCreateSuccess() {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 201,
            json: () => Promise.resolve({}),
        });
    }

    /**
     * Helper function to mock server error response
     * @param status - HTTP status code
     * @param message - Error message
     */
    function mockCreateError(status: number, message: string) {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status,
            json: () => Promise.resolve({ errorMessage: message }),
        });
    }

    /**
     * Helper function to mock network error
     */
    function mockNetworkError() {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
    }

    /**
     * Helper function to set up album in specific state
     * @param path - Album path
     * @param status - Album status
     */
    function mockAlbumState(path: string, status: AlbumStatus) {
        albumState.albums.set(path, { status });
    }

    describe('createAlbum', () => {
        it('should go NOT_LOADED > CREATING > LOADED when album creation succeeds', async () => {
            // Arrange: Set up album in NOT_LOADED state and mocks
            const albumPath = '/2024/01-01/';
            const parentPath = getParentFromPath(albumPath);
            mockAlbumState(albumPath, AlbumStatus.NOT_LOADED);
            mockCreateSuccess();
            fetchFromServerSpy.mockResolvedValue(undefined);

            // Act: Trigger album creation
            albumCreateMachine.createAlbum(albumPath);

            // Assert: Verify initial creating state
            expectAlbumStatus(albumPath, AlbumStatus.CREATING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expect(mockFetch).toHaveBeenCalled();
                },
                { timeout: TEST_TIMEOUT },
            );
            await Promise.resolve();

            // Assert: Verify API call and side effects
            expectFetchCalledWithPath(albumPath);
            expect(fetchFromServerSpy).toHaveBeenNthCalledWith(1, albumPath);
            expect(fetchFromServerSpy).toHaveBeenNthCalledWith(2, parentPath);
            expect(fetchFromServerSpy).toHaveBeenCalledTimes(2);
            expect(toastPushSpy).toHaveBeenCalledWith(`Album [${albumPath}] created`);
        });

        it('should go DOES_NOT_EXIST > CREATING > LOADED when album creation succeeds', async () => {
            // Arrange: Set up album in DOES_NOT_EXIST state and mocks
            const albumPath = '/2024/01-01/';
            const parentPath = getParentFromPath(albumPath);
            mockAlbumState(albumPath, AlbumStatus.DOES_NOT_EXIST);
            mockCreateSuccess();
            fetchFromServerSpy.mockResolvedValue(undefined);

            // Act: Trigger album creation
            albumCreateMachine.createAlbum(albumPath);

            // Assert: Verify initial creating state
            expectAlbumStatus(albumPath, AlbumStatus.CREATING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expect(mockFetch).toHaveBeenCalled();
                },
                { timeout: TEST_TIMEOUT },
            );
            await Promise.resolve();

            // Assert: Verify API call and side effects
            expectFetchCalledWithPath(albumPath);
            expect(fetchFromServerSpy).toHaveBeenNthCalledWith(1, albumPath);
            expect(fetchFromServerSpy).toHaveBeenNthCalledWith(2, parentPath);
            expect(fetchFromServerSpy).toHaveBeenCalledTimes(2);
            expect(toastPushSpy).toHaveBeenCalledWith(`Album [${albumPath}] created`);
        });

        it('should throw error for invalid album path', async () => {
            // Arrange: Set up invalid path in NOT_LOADED state
            const invalidPath = 'invalid-path';
            mockAlbumState(invalidPath, AlbumStatus.NOT_LOADED);

            // Act: Trigger album creation
            albumCreateMachine.createAlbum(invalidPath);

            // Assert: Verify error state and side effects
            await vi.waitFor(
                () => {
                    expectAlbumStatus(invalidPath, AlbumStatus.CREATE_ERRORED);
                },
                { timeout: TEST_TIMEOUT },
            );

            expect(albumState.albums.get(invalidPath)?.errorMessage).toBe(`Invalid album path [${invalidPath}]`);
            expect(toastPushSpy).toHaveBeenCalledWith(`Error creating album: Invalid album path [${invalidPath}]`);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should throw error when album already exists in LOADED state', () => {
            // Arrange: Set up album in LOADED state
            const albumPath = '/2024/01-01/';
            mockAlbumState(albumPath, AlbumStatus.LOADED);

            // Act & Assert: Verify error is thrown
            expect(() => {
                albumCreateMachine.createAlbum(albumPath);
            }).toThrow('Album already exists');

            // Verify no state changes or API calls
            expectAlbumStatus(albumPath, AlbumStatus.LOADED);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should throw error when album already exists in LOADING state', () => {
            // Arrange: Set up album in LOADING state
            const albumPath = '/2024/01-01/';
            mockAlbumState(albumPath, AlbumStatus.LOADING);

            // Act & Assert: Verify error is thrown
            expect(() => {
                albumCreateMachine.createAlbum(albumPath);
            }).toThrow('Album already exists');

            // Verify no state changes or API calls
            expectAlbumStatus(albumPath, AlbumStatus.LOADING);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should go NOT_LOADED > CREATING > CREATE_ERRORED when server returns 400', async () => {
            // Arrange: Set up album in NOT_LOADED state and mock server error
            const albumPath = '/2024/01-01/';
            mockAlbumState(albumPath, AlbumStatus.NOT_LOADED);
            mockCreateError(400, 'Bad request');

            // Act: Trigger album creation
            albumCreateMachine.createAlbum(albumPath);

            // Assert: Verify initial creating state
            expectAlbumStatus(albumPath, AlbumStatus.CREATING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.CREATE_ERRORED);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Assert: Verify final state and side effects
            expectFetchCalledWithPath(albumPath);
            expect(albumState.albums.get(albumPath)?.errorMessage).toBe('Bad request');
            expect(toastPushSpy).toHaveBeenCalledWith('Error creating album: Bad request');
            // Parent reload should not happen on error
            expect(fetchFromServerSpy).not.toHaveBeenCalled();
        });

        it('should go NOT_LOADED > CREATING > CREATE_ERRORED when server returns 500', async () => {
            // Arrange: Set up album in NOT_LOADED state and mock server error
            const albumPath = '/2024/01-01/';
            mockAlbumState(albumPath, AlbumStatus.NOT_LOADED);
            mockCreateError(500, 'Internal server error');

            // Act: Trigger album creation
            albumCreateMachine.createAlbum(albumPath);

            // Assert: Verify initial creating state
            expectAlbumStatus(albumPath, AlbumStatus.CREATING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.CREATE_ERRORED);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Assert: Verify final state and side effects
            expectFetchCalledWithPath(albumPath);
            expect(albumState.albums.get(albumPath)?.errorMessage).toBe('Internal server error');
            expect(toastPushSpy).toHaveBeenCalledWith('Error creating album: Internal server error');
            // Parent reload should not happen on error
            expect(fetchFromServerSpy).not.toHaveBeenCalled();
        });

        it('should go NOT_LOADED > CREATING > CREATE_ERRORED when server returns 422 validation error', async () => {
            // Arrange: Set up album in NOT_LOADED state and mock validation error
            const albumPath = '/2024/01-01/';
            mockAlbumState(albumPath, AlbumStatus.NOT_LOADED);
            mockCreateError(422, 'Invalid album name');

            // Act: Trigger album creation
            albumCreateMachine.createAlbum(albumPath);

            // Assert: Verify initial creating state
            expectAlbumStatus(albumPath, AlbumStatus.CREATING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.CREATE_ERRORED);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Assert: Verify final state and side effects
            expectFetchCalledWithPath(albumPath);
            expect(albumState.albums.get(albumPath)?.errorMessage).toBe('Invalid album name');
            expect(toastPushSpy).toHaveBeenCalledWith('Error creating album: Invalid album name');
            // Parent reload should not happen on error
            expect(fetchFromServerSpy).not.toHaveBeenCalled();
        });

        it('should go NOT_LOADED > CREATING > CREATE_ERRORED when server returns error without message', async () => {
            // Arrange: Set up album in NOT_LOADED state and mock server error without message
            const albumPath = '/2024/01-01/';
            mockAlbumState(albumPath, AlbumStatus.NOT_LOADED);
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: () => Promise.resolve({}),
            });

            // Act: Trigger album creation
            albumCreateMachine.createAlbum(albumPath);

            // Assert: Verify initial creating state
            expectAlbumStatus(albumPath, AlbumStatus.CREATING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.CREATE_ERRORED);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Assert: Verify final state and side effects
            expectFetchCalledWithPath(albumPath);
            expect(albumState.albums.get(albumPath)?.errorMessage).toBe('Internal Server Error');
            expect(toastPushSpy).toHaveBeenCalledWith('Error creating album: Internal Server Error');
            // Parent reload should not happen on error
            expect(fetchFromServerSpy).not.toHaveBeenCalled();
        });

        it('should go NOT_LOADED > CREATING > CREATE_ERRORED when network error occurs', async () => {
            // Arrange: Set up album in NOT_LOADED state and mock network error
            const albumPath = '/2024/01-01/';
            mockAlbumState(albumPath, AlbumStatus.NOT_LOADED);
            mockNetworkError();

            // Act: Trigger album creation
            albumCreateMachine.createAlbum(albumPath);

            // Assert: Verify initial creating state
            expectAlbumStatus(albumPath, AlbumStatus.CREATING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expectAlbumStatus(albumPath, AlbumStatus.CREATE_ERRORED);
                },
                { timeout: TEST_TIMEOUT },
            );

            // Assert: Verify final state and side effects
            expectFetchCalledWithPath(albumPath);
            expect(albumState.albums.get(albumPath)?.errorMessage).toBe('Network error');
            expect(toastPushSpy).toHaveBeenCalledWith('Error creating album: Network error');
            // Parent reload should not happen on error
            expect(fetchFromServerSpy).not.toHaveBeenCalled();
        });

        it('should handle year album creation correctly', async () => {
            // Arrange: Set up year album in NOT_LOADED state and mocks
            const albumPath = '/2024/';
            const parentPath = getParentFromPath(albumPath);
            mockAlbumState(albumPath, AlbumStatus.NOT_LOADED);
            mockCreateSuccess();
            fetchFromServerSpy.mockResolvedValue(undefined);

            // Act: Trigger album creation
            albumCreateMachine.createAlbum(albumPath);

            // Assert: Verify initial creating state
            expectAlbumStatus(albumPath, AlbumStatus.CREATING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expect(mockFetch).toHaveBeenCalled();
                },
                { timeout: TEST_TIMEOUT },
            );
            await Promise.resolve();

            // Assert: Verify API call and side effects
            expectFetchCalledWithPath(albumPath);
            expect(fetchFromServerSpy).toHaveBeenNthCalledWith(1, albumPath);
            expect(fetchFromServerSpy).toHaveBeenNthCalledWith(2, parentPath);
            expect(fetchFromServerSpy).toHaveBeenCalledTimes(2);
            expect(toastPushSpy).toHaveBeenCalledWith(`Album [${albumPath}] created`);
        });

        it('should handle root album creation correctly', async () => {
            // Arrange: Set up root album in NOT_LOADED state and mocks
            const albumPath = '/';
            const parentPath = getParentFromPath(albumPath);
            mockAlbumState(albumPath, AlbumStatus.NOT_LOADED);
            mockCreateSuccess();
            fetchFromServerSpy.mockResolvedValue(undefined);

            // Act: Trigger album creation
            albumCreateMachine.createAlbum(albumPath);

            // Assert: Verify initial creating state
            expectAlbumStatus(albumPath, AlbumStatus.CREATING);

            // Wait: For async operations to complete
            await vi.waitFor(
                () => {
                    expect(mockFetch).toHaveBeenCalled();
                },
                { timeout: TEST_TIMEOUT },
            );
            await Promise.resolve();

            // Assert: Verify API call and side effects
            expectFetchCalledWithPath(albumPath);
            expect(fetchFromServerSpy).toHaveBeenNthCalledWith(1, albumPath);
            expect(fetchFromServerSpy).toHaveBeenNthCalledWith(2, parentPath);
            expect(fetchFromServerSpy).toHaveBeenCalledTimes(2);
            expect(toastPushSpy).toHaveBeenCalledWith(`Album [${albumPath}] created`);
        });
    });
});
