import { longDate } from '$lib/utils/date-utils';
import { albumPathToDate } from '$lib/utils/galleryPathUtils';
import { AlbumBaseImpl } from './AlbumBaseImpl';
import type { Album } from '../GalleryItemInterfaces';

export class AlbumDayImpl extends AlbumBaseImpl implements Album {
    get title(): string {
        return longDate(this.date);
    }

    get parentTitle(): string {
        const parentDate = albumPathToDate(this.json.parentPath);
        return parentDate.getFullYear().toString();
    }
}
