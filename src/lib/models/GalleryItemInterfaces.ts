//
// The interfaces used by the Sveltekit UI
//

import type { AlbumGalleryItem, Rectangle } from './impl/server';

/**
 * Info needed to construct a thumbnail URL
 */
export interface ThumbnailUrlInfo {
    readonly imagePath: string;
    readonly versionId: string;
    readonly crop?: Rectangle;
}

export interface Album extends Nextable {
    published: boolean;
    summary: string;
    thumbnailPath: string | undefined;
    readonly json: AlbumGalleryItem; // so that I can save the JSON to disk
    readonly parentHref: string;
    readonly parentTitle: string;
    readonly images: Thumbable[];
    readonly albums: Thumbable[];
    getImage(imagePath: string): Image | undefined;
}

export interface Image extends Nextable {
    title: string;
    readonly originalUrl: string;
    readonly originalWidth: number;
    readonly originalHeight: number;
    readonly detailUrl: string;
    readonly detailWidth: number;
    readonly detailHeight: number;
    readonly versionId: string;
    readonly thumbnail: Rectangle | undefined;
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
    readonly thumbnailUrlInfo: ThumbnailUrlInfo | undefined;
    readonly href: string;
    readonly published: boolean;
}
