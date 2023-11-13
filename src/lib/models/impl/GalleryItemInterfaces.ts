//
// The interfaces used by the Sveltekit UI
//

export interface Album extends BaseGalleryItem {
    get published(): boolean;
    get parentHref(): string;
    get parentTitle(): string;
    get images(): Thumbable[];
    get albums(): Thumbable[];
    set thumbnailUrl(thumbnailUrl: string | undefined);
    getImage(imagePath: string): Image | undefined;
}

export interface Image extends BaseGalleryItem {}

export interface BaseGalleryItem extends Thumbable {
    get prevHref(): string | undefined;
    get nextHref(): string | undefined;
    get prevTitle(): string | undefined;
    get nextTitle(): string | undefined;
}

export interface Thumbable {
    get path(): string; // TODO: replace with get id(), stop using path in the UI
    get title(): string;
    get description(): string;
    set description(description: string);
    get summary(): string;
    get thumbnailUrl(): string | undefined;
    get href(): string;
}
