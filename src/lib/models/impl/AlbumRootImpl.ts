import { AlbumBaseImpl } from './AlbumBaseImpl';
import type { Album } from '../GalleryItemInterfaces';

export class AlbumRootImpl extends AlbumBaseImpl implements Album {
    get title(): string {
        return '';
    }
    get parentTitle(): string {
        return '';
    }
}
