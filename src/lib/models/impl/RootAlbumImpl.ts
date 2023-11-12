import { BaseAlbumImpl } from './BaseAlbumImpl';
import type { Album } from './GalleryItemInterfaces';

export class RootAlbumImpl extends BaseAlbumImpl implements Album {
    get title(): string {
        return '';
    }
    get parentTitle(): string {
        return '';
    }
    get prevTitle(): string | undefined {
        return undefined;
    }
    get nextTitle(): string | undefined {
        return undefined;
    }
}
