import type { GalleryItem } from '../server';

//
// The interfaces used by the Sveltekit UI
//

export interface Album extends BaseGalleryItem {
    get published(): boolean;
    get parentHref(): string;
    get parentTitle(): string;
    get images(): Image[];
    get albums(): GalleryItem[];
    set thumbnailUrl(thumbnailUrl: string | undefined);
    getImage(imagePath: string): Image | undefined;
}

export interface Image extends BaseGalleryItem {}

interface BaseGalleryItem extends Thumbable {
    get prevHref(): string | undefined;
    get nextHref(): string | undefined;
    get prevTitle(): string | undefined;
    get nextTitle(): string | undefined;
}

export interface Thumbable {
    get path(): string;
    get title(): string;
    get description(): string;
    get summary(): string;
    get thumbnailUrl(): string | undefined;
    get href(): string;
}
