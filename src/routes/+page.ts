import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore';
import { redirectIfLegacyUrl } from '$lib/utils/legacyUrlHandler';

export const load: PageLoad = () => {
	redirectIfLegacyUrl(location.hash);

	const pathToRootAlbum = '';
	return {
		albumEntry: albumStore.get(pathToRootAlbum)
	};
};
