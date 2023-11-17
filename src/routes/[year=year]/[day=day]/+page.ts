import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore';
import { getUploads } from '$lib/stores/UploadStore';

export const load: PageLoad = ({ params }) => {
    const year = params.year;
    const albumPath = `/${params.year}/${params.day}/`;
    const albumEntry = albumStore.get(albumPath);
    const uploads = getUploads();

    return {
        year,
        albumEntry,
        uploads,
    };
};
