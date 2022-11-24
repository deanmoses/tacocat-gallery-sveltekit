import type { PageLoad } from './$types';
import { albumStore } from "$lib/stores/AlbumStore";

export const load: PageLoad = ({ params }) => {
    const pathToRootAlbum = "";

    return {
        albumEntry: albumStore.get(pathToRootAlbum)
    }
}