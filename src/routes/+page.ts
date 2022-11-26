import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore';

export const load: PageLoad = () => {
	const pathToRootAlbum = '';

	return {
		albumEntry: albumStore.get(pathToRootAlbum)
	};
};
