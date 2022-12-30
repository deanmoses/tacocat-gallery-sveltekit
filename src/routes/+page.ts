import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { albumStore } from '$lib/stores/AlbumStore';

export const load: PageLoad = () => {
	// If the URL contains an old style album in the hash, like #2001/12-31/felix.jpg
	if (location.hash) {
		const newUrl = location.hash.substring(1);
		throw redirect(301, newUrl);
	}

	// Otherwise show root album
	const pathToRootAlbum = '';
	return {
		albumEntry: albumStore.get(pathToRootAlbum)
	};
};
