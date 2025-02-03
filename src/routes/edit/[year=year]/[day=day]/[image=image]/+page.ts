import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore.svelte';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    const imagePath = `${albumPath}${params.image}`;
    albumStore.fetch(albumPath);
    return {
        albumPath,
        imagePath,
    };
};
