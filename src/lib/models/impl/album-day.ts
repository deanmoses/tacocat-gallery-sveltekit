import DateBasedAlbum from '$lib/models/impl/album-datebased';
import { longDate } from '$lib/utils/date-utils';
import { albumPathToDate, getParentFromPath } from '$lib/utils/galleryPathUtils';

/**
 * Overrides the default album class with  behavior specific to day albums.
 */
export default class DayAlbum extends DateBasedAlbum {
    get pageTitle(): string {
        return this.date ? longDate(this.date) : '';
    }

    get parentAlbumHref(): string {
        const parentPath = getParentFromPath(this.path);
        const parentDate = albumPathToDate(parentPath);
        return '/' + parentDate.getFullYear().toString();
    }

    get parentAlbumTitle(): string {
        const parentPath = getParentFromPath(this.path);
        const parentDate = albumPathToDate(parentPath);
        return parentDate.getFullYear().toString();
    }
}
