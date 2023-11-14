import { dev } from '$app/environment';
import { isValidAlbumPath, isValidImagePath } from './galleryPathUtils';

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
     * @param imagePath Path to an image like /2018/01-01/image.jpg
     */
    public static thumbnailUrl(imagePath: string): string {
        return `https://dacwtfk6o75l6.cloudfront.net/i${imagePath}/jpeg/200x200`;
    }

    /**
     * URL to optimized image for display on the image detail page
     * @param imagePath Path to an image like /2018/01-01/image.jpg
     */
    public static detailImagelUrl(imagePath: string): string {
        return `https://dacwtfk6o75l6.cloudfront.net/i${imagePath}`;
    }

    /**
     * URL to view the full sized original raw image
     * @param imagePath path to an image like /2018/01-01/image.jpg
     */
    public static originalImageUrl(imagePath: string): string {
        return `https://dacwtfk6o75l6.cloudfront.net${imagePath}`;
    }

    /**
     * URL to retrieve albums
     */
    public static albumUrl(path: string): string {
        if (!isValidAlbumPath(path)) throw new Error(`Invalid album path [${path}]`);
        return Config.baseApiUrl() + 'album' + path;
    }

    /**
     * URL to retrieve latest album
     */
    public static latestAlbumUrl(): string {
        return Config.baseApiUrl() + 'latest-album/';
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
        return Config.baseApiUrl() + (isValidImagePath(path) ? 'image' : 'album') + path;
    }

    /**
     * URL of the JSON REST API to search for the specified terms
     * @param searchTerms the terms to search for
     */
    public static searchUrl(searchTerms: string): string {
        return Config.baseApiUrl() + 'search/' + encodeURIComponent(searchTerms);
    }

    /**
     * URL to send a HTTP DELETE to delete an album or image
     * @param path path of album or image
     */
    public static deleteUrl(path: string): string {
        return Config.baseApiUrl() + (isValidImagePath(path) ? 'image' : 'album') + path;
    }

    private static baseApiUrl(): string {
        return dev ? '/api/Prod/' : 'https://v2kdsvx1hf.execute-api.us-east-1.amazonaws.com/Prod/';
    }
}
