import type { PageLoad } from './$types';
import { albumLoadMachine } from '$lib/stores/AlbumLoadMachine.svelte';
import { currentYearAlbumPath } from '$lib/utils/latestAlbum';

export const load: PageLoad = () => {
    const pathToRootAlbum = '/';
    albumLoadMachine.fetch(pathToRootAlbum);
    // The latest album's thumbnail is the current year's newest child
    albumLoadMachine.fetch(currentYearAlbumPath());
    return { pathToRootAlbum };
};
