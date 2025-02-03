import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore.svelte';

export const load: PageLoad = ({ params }) => {
    const albumPath = '/' + params.year + '/';
    albumStore.fetch(albumPath);
    return { albumPath };
};
