import DateBasedAlbum from '$lib/models/impl/album-datebased';
import { longDate } from '$lib/utils/date-utils';

/**
 * Overrides the default album class with  behavior specific to year albums.
 */
export default class DayAlbum extends DateBasedAlbum {
	/**
	 * Friendly title of page
	 */
	get pageTitle(): string {
		return longDate(this.date);
	}
}
