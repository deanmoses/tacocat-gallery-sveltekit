import type { PageLoad } from './$types';
import { albumLoadMachine } from '$lib/stores/AlbumLoadMachine.svelte';
import { getParentFromPath } from '$lib/utils/galleryPathUtils';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    albumLoadMachine.fetch(albumPath);
    albumLoadMachine.fetch(getParentFromPath(albumPath)); // the page's prev/next come from its child list
    return { albumPath };
};
