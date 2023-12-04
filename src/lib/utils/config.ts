import { dev } from '$app/environment';
import type { Rectangle } from '$lib/models/impl/server';
import { isValidAlbumPath, isValidImagePath } from './galleryPathUtils';

export const staging = true; // manual switch to allow the front end to test either staging or prod
const cdnDomain = staging ? 'img.staging-pix.tacocat.com' : 'img.pix.tacocat.com';

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
 * @param versionId Version of the image
 * @param crop Optional crop rectangle
 */
export function thumbnailUrl(imagePath: string, versionId: string, crop?: Rectangle | undefined): string {
    return (
        `https://${cdnDomain}/i${imagePath}/${versionId}/jpeg/200x200` +
        (crop ? `/crop=${crop.x},${crop.y},${crop.width},${crop.height}` : '')
    );
}

/**
 * URL to optimized image for display on the image detail page
 * @param imagePath Path to an image like /2001/12-31/image.jpg
 * @param versionId Version of the image
 * @param sizing size like '1024' (landscape) or 'x1024' (portrait)
 */
export function detailImagelUrl(imagePath: string, versionId: string, sizing: string): string {
    return `https://${cdnDomain}/i${imagePath}/${versionId}/jpeg/${sizing}`;
}

/**
 * URL to view the full sized original raw image
 * @param imagePath path to an image like /2001/12-31/image.jpg
 */
export function originalImageUrl(imagePath: string): string {
    return `https://${cdnDomain}${imagePath}`;
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

function baseApiUrl(): string {
    return dev ? '/api/' : staging ? 'https://api.staging-pix.tacocat.com/' : 'https://api.pix.tacocat.com/';
}

/**
 * URL to check user's authentication status
 */
export function checkAuthenticationUrl(): string {
    return baseAuthApiUrl();
}

/**
 * URL that redirects to the Cognito-hosted login page
 */
export function getLoginUrl(): string {
    return baseAuthApiUrl() + 'login';
}

/**
 * URL that deletes cookies and redirects to the Cognito-hosted logout page
 */
export function getLogoutUrl(): string {
    return baseAuthApiUrl() + 'logout';
}

function baseAuthApiUrl(): string {
    return staging ? 'https://auth.staging-pix.tacocat.com/' : 'https://auth.pix.tacocat.com/';
}

export function getOriginalImagesBucketName(): string {
    return 'tacocat-gallery-sam-dev-original-images';
}
