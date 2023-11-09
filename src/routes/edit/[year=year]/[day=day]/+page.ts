import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore';

export const load: PageLoad = ({ params }) => {
    const year: string = params.year;
    const albumPath = `${params.year}/${params.day}`;
    const albumEntry = albumStore.get(albumPath);

    return {
        year,
        albumEntry,
    };
};
