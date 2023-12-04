import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore';

export const load: PageLoad = ({ params }) => {
    const albumPath = '/' + params.year + '/';
    const albumEntry = albumStore.get(albumPath);
    return {
        albumEntry,
    };
};
