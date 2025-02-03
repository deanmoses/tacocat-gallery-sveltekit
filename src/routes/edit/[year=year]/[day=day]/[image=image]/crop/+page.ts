import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore.svelte';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    const imagePath = `${albumPath}${params.image}`;
    const albumEntry = albumStore.get(albumPath);

    return {
        imagePath,
        albumEntry,
    };
};
