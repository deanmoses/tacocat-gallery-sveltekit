import { albumPathToDate } from '$lib/utils/galleryPathUtils';
import { AlbumBaseImpl } from './AlbumBaseImpl';
import type { Album } from '../GalleryItemInterfaces';

export class AlbumYearImpl extends AlbumBaseImpl implements Album {
    override get title(): string {
        return this.date ? this.date.getFullYear().toString() : '';
    }

    /** Never used but required to exist */
    get parentTitle(): string {
        return '';
    }

    get nextTitle(): string {
        return this.albumTitle(this.next);
    }

    get prevTitle(): string {
        return this.albumTitle(this.prev);
    }

    /**  Get title of a prev/next album */
    private albumTitle(albumPath?: string): string {
        return !!albumPath ? albumPathToDate(albumPath).getFullYear().toString() : '';
    }
}
