import { albumStore } from '$lib/stores/AlbumStore';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    const imagePath = `${albumPath}${params.image}`;
    const refetch = false; // don't refetch the album
    const albumEntry = albumStore.get(albumPath, refetch);
    return {
        imagePath,
        albumEntry,
    };
};
