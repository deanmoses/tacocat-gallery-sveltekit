import type { PageLoad } from './$types';
import { albumLoadMachine } from '$lib/state/AlbumLoadMachine.svelte';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    const imagePath = `${albumPath}${params.image}`;
    albumLoadMachine.fetch(albumPath);
    return {
        albumPath,
        imagePath,
    };
};
