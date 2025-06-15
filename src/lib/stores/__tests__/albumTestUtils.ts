import { getParentFromPath } from '$lib/utils/galleryPathUtils';
import type { AlbumRecord } from '$lib/models/impl/server';

export function createMockAlbumRecordFromPath(albumPath: string) {
    return createMockAlbumRecord({ path: albumPath });
}

/**
 * Utility to create a mock AlbumRecord for tests.
 * This represents what would be stored in IDB or received from the server.
 */
export function createMockAlbumRecord(partialAlbumRecord: Partial<AlbumRecord> = {}): AlbumRecord {
    const albumPath = partialAlbumRecord.path ?? '/2024/01-01/';

    return {
        path: albumPath,
        parentPath: getParentFromPath(albumPath),
        itemName: '01-01',
        itemType: 'album',
        description: '',
        published: true,
        summary: '',
        updatedOn: new Date().toISOString(),
        ...partialAlbumRecord
    };
}