import { Album, AlbumType } from '$lib/models/models';
import RootAlbum from '$lib/models/album-year';
import YearAlbum from '$lib/models/album-year';
import DayAlbum from '$lib/models/album-day';
import { getAlbumType } from '$lib/utils/path-utils';

/**
 * Create an Album or a subclass of Album
 * @param json JSON or any Object
 */
export default function createAlbumFromObject(json: any): Album {
	let alb: Album = instantiateAlbum(json);
	return Object.assign(alb, json);
}

function instantiateAlbum(json: any): Album {
	const type = getAlbumType(json.path);

	switch (type) {
		case AlbumType.ROOT: {
			return new RootAlbum(json.path);
		}
		case AlbumType.YEAR: {
			return new YearAlbum(json.path);
		}
		case AlbumType.DAY: {
			return new DayAlbum(json.path);
		}
		default:
			throw new Error('Unexpected type');
	}
}