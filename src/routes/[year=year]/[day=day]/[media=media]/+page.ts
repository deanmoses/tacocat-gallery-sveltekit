import { albumLoadMachine } from '$lib/stores/AlbumLoadMachine.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    const mediaPath = `${albumPath}${params.media}`;
    const refetch = false; // don't refetch the album
    albumLoadMachine.fetch(albumPath, refetch);
    return {
        albumPath,
        mediaPath,
    };
};
