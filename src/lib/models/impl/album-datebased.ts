import { AlbumImpl } from '$lib/models/impl/album-impl';
import { shortDate } from '$lib/utils/date-utils';
import { albumPathToDate } from '$lib/utils/galleryPathUtils';

/**
 * Overrides the default album class with behavior specific to any album that shows titles based
 * on dates and not what the admin typed in.
 */
export default class DateBasedAlbum extends AlbumImpl {
    get date(): Date {
        return albumPathToDate(this.path);
    }

    /**
     * Title of next album or blank if no next
     */
    get nextAlbumTitle(): string {
        if (!!this?.next?.path) {
            const d = albumPathToDate(this.next.path);
            return shortDate(d);
        }
        return '';
    }

    /**
     * Title of previous album or blank if no prev
     */
    get prevAlbumTitle(): string {
        if (!!this?.prev?.path) {
            const d = albumPathToDate(this.prev.path);
            return shortDate(d);
        }
        return '';
    }
}
