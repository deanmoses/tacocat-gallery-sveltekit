import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore.svelte';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    albumStore.fetch(albumPath);
    return { albumPath };
};
