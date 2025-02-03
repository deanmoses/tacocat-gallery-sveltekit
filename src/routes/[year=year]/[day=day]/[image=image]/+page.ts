import { albumStore } from '$lib/stores/AlbumStore.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    const imagePath = `${albumPath}${params.image}`;
    const refetch = false; // don't refetch the album
    albumStore.fetch(albumPath, refetch);
    return {
        albumPath,
        imagePath,
    };
};
