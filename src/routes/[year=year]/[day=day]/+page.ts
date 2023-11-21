import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore';
import { getUploads } from '$lib/stores/UploadStore';

export const load: PageLoad = ({ params }) => {
    const albumPath = `/${params.year}/${params.day}/`;
    const albumEntry = albumStore.get(albumPath);
    const uploads = getUploads();

    return {
        albumEntry,
        uploads,
    };
};
