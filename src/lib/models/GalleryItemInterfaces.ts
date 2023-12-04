//
// The interfaces used by the Sveltekit UI
//

import type { AlbumGalleryItem } from './impl/server';

export interface Album extends Nextable {
    published: boolean;
    summary: string;
    thumbnailPath: string | undefined;
    readonly thumbnailUrl: string | undefined;
    readonly json: AlbumGalleryItem; // so that I can save the JSON to disk
    readonly parentHref: string;
    readonly parentTitle: string;
    readonly images: Thumbable[];
    readonly albums: Thumbable[];
    getImage(imagePath: string): Image | undefined;
}

export interface Image extends Nextable {
    title: string;
    readonly detailUrl: string;
    readonly originalUrl: string;
    readonly width: number;
    readonly height: number;
    readonly versionId: string;
}

export interface Nextable extends Thumbable {
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
