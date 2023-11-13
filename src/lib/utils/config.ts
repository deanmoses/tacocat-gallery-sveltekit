import { dev } from '$app/environment';
import { isValidAlbumPath } from './galleryPathUtils';
import { isImagePath } from './path-utils';

/**
 * Configuration global to the application
 */
export default abstract class Config {
    /**
     * The title of the site, such as shown in the header of the site.
     */
    public static siteTitle(): string {
        return 'Dean, Lucie, Felix and Milo Moses';
    }

    /**
     * The shorter title of the site, to be shown when space is limited.
     */
    public static siteShortTitle(): string {
        return 'The Moses Family';
    }

    /**
     * URL to CDN'ed derived images
     * @argument pathAndFormat Path to an image + a format like /2018/01-01/image.jpg/jpeg/70x70'
     */
    public static thumbnailUrl(pathAndFormat: string): string {
        return `https://dacwtfk6o75l6.cloudfront.net/i${pathAndFormat}/jpeg/200x200`;
    }

    /**
     * URL to retrieve albums
     */
    public static albumUrl(path: string): string {
        if (!isValidAlbumPath(path)) throw new Error(`Invalid album path [${path}]`);
        if (dev) {
            return '/api/Prod/album' + path;
        }
        return 'https://v2kdsvx1hf.execute-api.us-east-1.amazonaws.com/Prod/album' + path;
    }

    /**
     * URL to retrieve latest album
     */
    public static latestAlbumUrl(): string {
        if (dev) {
            return '/api/Prod/latest-album/';
        }
        return 'https://v2kdsvx1hf.execute-api.us-east-1.amazonaws.com/Prod/latest-album/';
    }

    /**
     * URL to check user's authentication status
     */
    public static checkAuthenticationUrl(): string {
        return 'https://tacocat.com/zenphoto/?api&auth'; // TODO MIGRATE
    }

    /**
     * URL to send a HTTP PATCH to update an album or an image
     * @param path path of album or image
     */
    public static updateUrl(path: string): string {
        if (dev) {
            return isImagePath(path) ? '/api/Prod/image' + path : '/api/Prod/album' + path;
        }
        return isImagePath(path)
            ? 'https://v2kdsvx1hf.execute-api.us-east-1.amazonaws.com/Prod/image' + path
            : 'https://v2kdsvx1hf.execute-api.us-east-1.amazonaws.com/Prod/album' + path;
    }

    /**
     * URL of the JSON REST API to search for the specified terms
     * @argument searchTerms the terms to search for
     */
    public static searchUrl(searchTerms: string): string {
        if (dev) {
            return '/api/Prod/search/' + encodeURIComponent(searchTerms);
        }
        return 'https://v2kdsvx1hf.execute-api.us-east-1.amazonaws.com/Prod/search/' + encodeURIComponent(searchTerms);
    }

    /**
     * URL to view the full sized raw image
     * @param imagePath path to an image
     */
    public static fullSizeImageUrl(imagePath: string): string {
        return imagePath; // TODO MIGRATE
    }
}
