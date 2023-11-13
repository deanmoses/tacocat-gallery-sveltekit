import { AlbumBaseImpl } from './AlbumBaseImpl';
import type { Album } from '../GalleryItemInterfaces';

export class AlbumRootImpl extends AlbumBaseImpl implements Album {
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
