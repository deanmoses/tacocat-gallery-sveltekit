import DateBasedAlbum from '$lib/models/album-datebased';

/**
 * Overrides the default album class with  behavior specific to year albums.
 */
export default class RootAlbum extends DateBasedAlbum {
	/**
	 * Friendly title of page
	 */
	get pageTitle(): string {
		return '';
	}
}
