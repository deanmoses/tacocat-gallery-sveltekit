import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore';
import { getAlbumDeleteEntry } from '$lib/stores/AlbumDeleteStore';

export const load: PageLoad = ({ params }) => {
    const albumPath: string = '/' + params.year + '/';
    const albumEntry = albumStore.get(albumPath);
    const deleteEntry = getAlbumDeleteEntry(albumPath);
    return {
        albumEntry,
        deleteEntry,
    };
};
