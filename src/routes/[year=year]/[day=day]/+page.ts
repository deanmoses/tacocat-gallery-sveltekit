import type { PageLoad } from './$types';
import { albumStore } from '$lib/stores/AlbumStore';

export const load: PageLoad = ({ params }) => {
	const year = params.year;
	const albumPath = `${params.year}/${params.day}`;
	const albumEntry = albumStore.get(albumPath);

	return {
		year,
		albumEntry
	};
};
