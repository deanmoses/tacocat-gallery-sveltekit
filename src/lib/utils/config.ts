import { dev } from '$app/environment';
import type { Rectangle } from '$lib/models/impl/server';
import { isValidAlbumPath, isValidImagePath } from './galleryPathUtils';

/**
 * The title of the site, such as shown in the header of the site.
 */
export function siteTitle(): string {
    return 'Dean, Lucie, Felix and Milo Moses';
}

/**
 * The shorter title of the site, to be shown when space is limited.
 */
export function siteShortTitle(): string {
    return 'The Moses Family';
}

/**
 * URL to CDN'ed derived images
 * @param imagePath Path to an image like /2001/12-31/image.jpg
 */
export function thumbnailUrl(imagePath: string, crop?: Rectangle | undefined): string {
    return (
        `https://dacwtfk6o75l6.cloudfront.net/i${imagePath}/jpeg/200x200` +
        (crop ? `/crop=${crop.x},${crop.y},${crop.width},${crop.height}` : '')
    );
}

/**
 * URL to optimized image for display on the image detail page
 * @param imagePath Path to an image like /2001/12-31/image.jpg
 */
export function detailImagelUrl(imagePath: string): string {
    return `https://dacwtfk6o75l6.cloudfront.net/i${imagePath}`;
}

/**
 * URL to view the full sized original raw image
 * @param imagePath path to an image like /2001/12-31/image.jpg
 */
export function originalImageUrl(imagePath: string): string {
    return `https://dacwtfk6o75l6.cloudfront.net${imagePath}`;
}

/**
 * URL to retrieve an album
 */
export function albumUrl(path: string): string {
    if (!isValidAlbumPath(path)) throw new Error(`Invalid album path [${path}]`);
    return baseApiUrl() + 'album' + path;
}

/**
 * URL to send HTTP PUT to create an album or image
 * @param path path of album or image
 */
export function createUrl(path: string): string {
    return baseApiUrl() + (isValidImagePath(path) ? 'image' : 'album') + path;
}

/**
 * URL to send HTTP PATCH to update an album or an image
 * @param path path of album or image
 */
export function updateUrl(path: string): string {
    return baseApiUrl() + (isValidImagePath(path) ? 'image' : 'album') + path;
}

/**
 * URL to send HTTP DELETE to delete an album or image
 * @param path path of album or image
 */
export function deleteUrl(path: string): string {
    return baseApiUrl() + (isValidImagePath(path) ? 'image' : 'album') + path;
}

/**
 * URL to send HTTP PATCH to set album thumbnail
 * @param albumPath path to an album like /2001/12-31/
 */
export function setThumbnailUrl(albumPath: string): string {
    return baseApiUrl() + 'album-thumb' + albumPath;
}

/**
 * URL to send HTTP PATCH to recrop an image thumbnail
 * @param imagePath path to an image like /2001/12-31/image.jpg
 */
export function recropThumbnailUrl(imagePath: string): string {
    return baseApiUrl() + 'thumb' + imagePath;
}

/**
 * URL to send HTTP POST to rename an album
 * @param albumPath path to an album like /2001/12-31/
 */
export function renameAlbumUrl(albumPath: string): string {
    return baseApiUrl() + 'album-rename' + albumPath;
}

/**
 * URL to send HTTP POST to rename an image
 * @param imagePath path to an image like /2001/12-31/image.jpg
 */
export function renameImageUrl(imagePath: string): string {
    return baseApiUrl() + 'image-rename' + imagePath;
}

/**
 * URL to retrieve latest album
 */
export function latestAlbumUrl(): string {
    return baseApiUrl() + 'latest-album/';
}

/**
 * URL of the JSON REST API to search for the specified terms
 * @param searchTerms the terms to search for
 */
export function searchUrl(searchTerms: string): string {
    return baseApiUrl() + 'search/' + encodeURIComponent(searchTerms);
}

/**
 * URL to check user's authentication status
 */
export function checkAuthenticationUrl(): string {
    return 'https://tacocat.com/zenphoto/?api&auth'; // TODO MIGRATE
}

function baseApiUrl(): string {
    return dev ? '/api/Prod/' : 'https://v2kdsvx1hf.execute-api.us-east-1.amazonaws.com/Prod/';
}
