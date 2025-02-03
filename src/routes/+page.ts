import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore.svelte';

export const load: PageLoad = () => {
    const pathToRootAlbum = '/';
    albumStore.fetch(pathToRootAlbum);
    return { pathToRootAlbum };
};
