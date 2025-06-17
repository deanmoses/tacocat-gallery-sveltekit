import type { PageLoad } from './$types';
import { albumLoadMachine } from '$lib/state/AlbumLoadMachine.svelte';

export const load: PageLoad = () => {
    const pathToRootAlbum = '/';
    albumLoadMachine.fetch(pathToRootAlbum);
    return { pathToRootAlbum };
};
