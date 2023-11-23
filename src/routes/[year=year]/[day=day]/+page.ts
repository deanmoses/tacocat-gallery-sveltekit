import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore';
import { getUploads } from '$lib/stores/UploadStore';
import { getAlbumRenameEntry } from '$lib/stores/AlbumRenameStore';
import { getAlbumDeleteEntry } from '$lib/stores/AlbumDeleteStore';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    const albumEntry = albumStore.get(albumPath);
    const uploads = getUploads(albumPath);
    const renameEntry = getAlbumRenameEntry(albumPath);
    const deleteEntry = getAlbumDeleteEntry(albumPath);
    return {
        albumEntry,
        uploads,
        renameEntry,
        deleteEntry,
    };
};
