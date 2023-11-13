import { isValidAlbumPath } from './galleryPathUtils';

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
     * URL to CDN-servable stuff
     * @argument path Path to an image, such as /zenphoto/cache/2018/01-01/new_years_eve06_1024.jpg
     */
    public static cdnUrl(path: string): string {
        return path; // TODO MIGRATE
    }

    /**
     * URL to retrieve albums
     */
    public static albumUrl(path: string): string {
        if (!isValidAlbumPath(path)) throw new Error(`Invalid album path [${path}]`);
        return 'https://v2kdsvx1hf.execute-api.us-east-1.amazonaws.com/Prod/album' + path;
    }

    /**
     * URL to retrieve latest album
     */
    public static latestAlbumUrl(): string {
        return 'https://v2kdsvx1hf.execute-api.us-east-1.amazonaws.com/Prod/latest-album/';
    }

    /**
     * URL to check user's authentication status
     */
    public static checkAuthenticationUrl(): string {
        return 'xxx'; // TODO MIGRATE
    }

    /**
     * URL to send a HTTP POST to save an album or an image
     * @param path path of an album or an image
     */
    public static saveUrl(path: string): string {
        return path; // TODO MIGRATE
    }

    /**
     * URL of the JSON REST API to search for the specified terms
     * @argument searchTerms the terms to search for
     */
    public static searchUrl(searchTerms: string): string {
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
