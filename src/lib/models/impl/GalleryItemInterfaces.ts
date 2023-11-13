//
// The interfaces used by the Sveltekit UI
//

export interface Album extends BaseGalleryItem {
    published: boolean;
    summary: string;
    thumbnailUrl: string | undefined;
    readonly parentHref: string;
    readonly parentTitle: string;
    readonly images: Thumbable[];
    readonly albums: Thumbable[];
}

export interface Image extends BaseGalleryItem {
    title: string;
}

export interface BaseGalleryItem extends Thumbable {
    readonly prevHref: string | undefined;
    readonly nextHref: string | undefined;
    readonly prevTitle: string | undefined;
    readonly nextTitle: string | undefined;
}

export interface Thumbable {
    readonly path: string; // TODO: replace with get id() and stop using path in the UI
    readonly title: string;
    description: string;
    readonly summary: string;
    readonly thumbnailUrl: string | undefined;
    readonly href: string;
}
