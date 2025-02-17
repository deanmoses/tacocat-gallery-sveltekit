import type { PageLoad } from './$types';

import { albumLoadMachine } from '$lib/stores/AlbumLoadMachine.svelte';

export const load: PageLoad = ({ params }) => {
    const albumPath = '/' + params.year + '/';
    albumLoadMachine.fetch(albumPath);
    return { albumPath };
};
