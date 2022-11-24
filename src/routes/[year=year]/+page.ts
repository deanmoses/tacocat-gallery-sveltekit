import type { PageLoad } from './$types';
import { albumStore } from "$lib/stores/AlbumStore";

export const load: PageLoad = ({ params }) => {
	const year: string = params.year;
	const albumPath = params.year;

	return {
		year,
		albumEntry: albumStore.get(albumPath)
	};
}
