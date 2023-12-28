import { dev } from '$app/environment';
import type { Rectangle } from '$lib/models/impl/server';
import type { SearchQuery } from '$lib/stores/SearchStore';
import { emulateProdOnLocalhost } from './settings';
import { isValidAlbumPath, isValidImagePath } from './galleryPathUtils';
import { browser } from '$app/environment';

/**
 * I'm in staging (aka development) when one of these is true:
 *  - I'm on the staging domain
 *  - I'm on localhost and I'm not emulating prod
 * At all other times, I'm in prod.
 */
function isStaging(): boolean {
    if (!browser) return false; // To make SSR build happy
    return (
        window?.location?.hostname?.includes('staging') ||
        (window?.location?.hostname?.includes('localhost') && !emulateProdOnLocalhost)
    );
}

function baseApiUrl(): string {
    return dev ? '/api/' : isStaging() ? 'https://api.staging-pix.tacocat.com/' : 'https://api.pix.tacocat.com/';
}
function baseAuthApiUrl(): string {
    return isStaging() ? 'https://auth.staging-pix.tacocat.com/' : 'https://auth.pix.tacocat.com/';
}

function cdnDomain(): string {
    return isStaging() ? 'img.staging-pix.tacocat.com' : 'img.pix.tacocat.com';
}

/**
 * URL to CDN'ed derived images
 * @param imagePath Path to an image like /2001/12-31/image.jpg
 * @param versionId Version of the image
 * @param crop Optional crop rectangle
 */
export function thumbnailUrl(imagePath: string, versionId: string, crop?: Rectangle | undefined): string {
    return (
        `https://${cdnDomain()}/i${imagePath}?version=${versionId}&size=200x200` +
        (crop ? `&crop=${crop.x},${crop.y},${crop.width},${crop.height}` : '')
    );
}

/**
 * URL to optimized image for display on the image detail page
 * @param imagePath Path to an image like /2001/12-31/image.jpg
 * @param versionId Version of the image
 * @param size size like '1024' (landscape) or 'x1024' (portrait)
 */
export function detailImageUrl(imagePath: string, versionId: string, size: string): string {
    return `https://${cdnDomain()}/i${imagePath}?version=${versionId}&size=${size}`;
}

/**
 * URL to view the full sized original raw image
 * @param imagePath path to an image like /2001/12-31/image.jpg
 */
export function originalImageUrl(imagePath: string): string {
    return `https://${cdnDomain()}${imagePath}`;
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
 * URL to send HTTP POST to generate presigned upload URLs
 * @param albumPath path to an album like /2001/12-31/
 */
export function getPresignedUploadUrlGenerationUrl(albumPath: string): string {
    return baseApiUrl() + 'presigned' + albumPath;
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
 */
export function searchUrl(q: SearchQuery): string {
    let url = baseApiUrl() + 'search/' + encodeURIComponent(q.terms);
    const params: string[] = [];
    if (q.oldestYear) params.push('oldest=' + q.oldestYear);
    if (q.newestYear) params.push('newest=' + q.newestYear);
    if (q.oldestFirst) params.push('oldestFirst=' + q.oldestFirst);
    if (params) url += '?' + params.join('&');
    return url;
}

/**
 * Relative search URL within the Sveltekit app
 */
export function localSearchUrl(q: SearchQuery, returnPath: string): string {
    let url = '/search/' + encodeURIComponent(ensureDumbQuotes(q.terms));
    const params: string[] = [];
    params.push('returnPath=' + returnPath);
    if (q.oldestYear) params.push('oldest=' + q.oldestYear);
    if (q.newestYear) params.push('newest=' + q.newestYear);
    if (q.oldestFirst) params.push('oldestFirst=' + q.oldestFirst);
    if (params) url += '?' + params.join('&');
    return url;
}

/**
 * Phones insert smart quotes.
 * The search engine doesn't understand them.
 * Turn them into dumb quotes.
 */
function ensureDumbQuotes(searchTerms: string): string {
    return searchTerms.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

/**
 * URL to send HTTP POST to reset Redis search engine
 */
export function redisResetUrl(): string {
    return baseApiUrl() + 'redis-reset';
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
