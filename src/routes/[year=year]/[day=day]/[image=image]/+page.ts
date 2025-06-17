import { albumLoadMachine } from '$lib/state/AlbumLoadMachine.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    const imagePath = `${albumPath}${params.image}`;
    const refetch = false; // don't refetch the album
    albumLoadMachine.fetch(albumPath, refetch);
    return {
        albumPath,
        imagePath,
    };
};
