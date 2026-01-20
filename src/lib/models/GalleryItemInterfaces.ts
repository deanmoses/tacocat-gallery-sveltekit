//
// The interfaces used by the Sveltekit UI
//

import type { AlbumGalleryItem, Rectangle } from './impl/server';

/** Type of gallery item */
export type ItemType = 'album' | 'media';

/** Type of media item */
export type MediaType = 'image' | 'video';

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
    readonly media: Media[];
    readonly albums: Thumbable[];
    getMedia(mediaPath: string): Media | undefined;
}

/** Base interface for all media items (images and videos) */
export interface Media extends Nextable {
    readonly mediaType: MediaType;
    title: string;
    readonly versionId: string;
    readonly thumbnail: Rectangle | undefined;
    /** Sized image for photos, poster for videos */
    readonly detailUrl: string;
    readonly detailWidth: number;
    readonly detailHeight: number;
}

export interface Image extends Media {
    readonly mediaType: 'image';
    readonly originalUrl: string;
    readonly originalWidth: number;
    readonly originalHeight: number;
}

export interface Video extends Media {
    readonly mediaType: 'video';
    /** URL-safe ID for constructing video playback URL */
    readonly id: string;
    /** Duration in seconds */
    readonly duration: number;
}

export interface Nextable extends Thumbable {
    readonly prevHref: string | undefined;
    readonly nextHref: string | undefined;
    readonly prevTitle: string | undefined;
    readonly nextTitle: string | undefined;
}

export interface Thumbable {
    readonly path: string;
    readonly itemType: ItemType;
    readonly mediaType?: MediaType;
    readonly title: string;
    description: string;
    readonly summary: string;
    readonly thumbnailUrlInfo: ThumbnailUrlInfo | undefined;
    readonly href: string;
    readonly published: boolean;
}
