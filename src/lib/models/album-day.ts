import DateBasedAlbum from '$lib/models/album-datebased';
import * as DateUtils from '$lib/utils/date-utils';

/**
 * Overrides the default album class with  behavior specific to year albums.
 */
export default class DayAlbum extends DateBasedAlbum {
	/**
	 * Friendly title of page
	 */
	get pageTitle(): string {
		return DateUtils.longDate(this.date);
	}
}
