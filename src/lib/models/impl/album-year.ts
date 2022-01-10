import type { AlbumNavInfo } from '$lib/models/album';
import DateBasedAlbum from '$lib/models/impl/album-datebased';
import { year } from '$lib/utils/date-utils';

/**
 * Overrides the default album class with  behavior specific to year albums.
 */
export default class YearAlbum extends DateBasedAlbum {
	/**
	 * Friendly title of page
	 */
	get pageTitle(): string {
		return year(this.date);
	}

	/**
	 * Title of next album
	 * Blank if no next album
	 */
	get nextAlbumTitle(): string {
		return this.albumTitle(this.next);
	}

	/**
	 * Title of previous album
	 * Blank if no previous album
	 */
	get prevAlbumTitle(): string {
		return this.albumTitle(this.prev);
	}

	/**
	 * Return title of another album to navigate to
	 */
	private albumTitle(anotherAlbum: AlbumNavInfo): string {
		return anotherAlbum ? year(anotherAlbum.date) : '';
	}
}
