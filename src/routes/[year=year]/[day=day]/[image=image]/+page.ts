import type { PageLoad } from './$types';
import { albumStore } from "$lib/stores/AlbumStore";

export const load: PageLoad = ({ params }) => {
	const year = params.year;
	const albumPath = `${params.year}/${params.day}`;
	const imagePath = `${albumPath}/${params.image}`;
	const refetch = false; // don't refetch the album

	return {
		year,
		imagePath,
		albumEntry: albumStore.get(albumPath, refetch)
	};
}
