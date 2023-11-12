import { albumPathToDate } from '$lib/utils/galleryPathUtils';
import { BaseAlbumImpl } from './BaseAlbumImpl';
import type { Album } from './GalleryItemInterfaces';

export class YearAlbumImpl extends BaseAlbumImpl implements Album {
    override get title(): string {
        return this.date ? this.date.getFullYear().toString() : '';
    }

    get parentTitle(): string {
        return 'XXX';
    }

    get nextTitle(): string {
        return this.albumTitle(this.next);
    }

    get prevTitle(): string {
        return this.albumTitle(this.prev);
    }

    /**
     * Return title of another album to navigate to
     */
    private albumTitle(albumPath?: string): string {
        return !!albumPath ? albumPathToDate(albumPath).getFullYear().toString() : '';
    }
}
