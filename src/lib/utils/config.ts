import { isImagePath, getAlbumType } from '$lib/utils/path-utils';
import { AlbumType } from '$lib/models/album';
import { getParentFromPath, getLeafItemOnPath } from '$lib/utils/path-utils';

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
     * Create URL to CDN-servable stuff.
     * @argument path Path to an image, such as /zenphoto/cache/2018/01-01/new_years_eve06_1024.jpg
     */
    public static cdnUrl(path: string): string {
        return 'https://cdn.tacocat.com' + path;
    }

    /**
     * URL of the JSON REST API from which to retrieve the album
     */
    public static albumUrl(path: string): string {
        const root = 'https://v2kdsvx1hf.execute-api.us-east-1.amazonaws.com/Prod/album/';
        switch (getAlbumType(path)) {
            case AlbumType.ROOT: {
                return root;
            }
            case AlbumType.YEAR: {
                return `${root}${path}/`;
            }
            default: {
                return `${root}${path}/`;
            }
        }
    }

    /**
     * URL of the JSON REST API to retrieve the latest album
     */
    public static latestAlbumUrl(): string {
        return 'https://tacocat.com/zenphoto/?json&latest_albums&depth=0';
    }

    /**
     * URL of the JSON REST API to check the user's authentication status
     */
    public static checkAuthenticationUrl(): string {
        return 'https://tacocat.com/zenphoto/?api&auth';
    }

    /**
     * URL to send a HTTP POST to save an album or an image
     * @param path path of an album or an image
     */
    public static saveUrl(path: string): string {
        const firstSlash = path.startsWith('/') ? '' : '/';
        if (isImagePath(path)) {
            return 'https://tacocat.com/zenphoto' + firstSlash + path;
        } else {
            // Not having the final slash messes up POSTing to the edit URL,
            // because as of late 2016 zenphoto started redirecting
            // to the version with the slash.
            const finalSlash = path.endsWith('/') ? '' : '/';
            return 'https://tacocat.com/zenphoto' + firstSlash + path + finalSlash;
        }
    }

    /**
     * URL to update the server's JSON file cache of a specific album
     *
     * This should only be called for year albums (/2001) or the root album (/)
     */
    public static refreshAlbumCacheUrl(albumPath: string): string {
        // strip the '/' off if it exists, so that "/2001" becomes "2001"
        const slashlessAlbumPath = albumPath.replace('/', '');
        return 'https://tacocat.com/p_json/refresh.php?album=' + slashlessAlbumPath;
    }

    /**
     * URL of the JSON REST API to search for the specified terms
     * @argument searchTerms the terms to search for
     */
    public static searchUrl(searchTerms: string): string {
        return 'https://tacocat.com/zenphoto/page/search/?search=' + encodeURIComponent(searchTerms) + '&json';
    }

    /**
     * URL to view the full sized raw image on Zenphoto
     * @param imagePath path to an image
     */
    public static fullSizeImageUrl(imagePath: string): string {
        return 'https://tacocat.com/zenphoto/albums/' + imagePath;
    }

    /**
     * URL to view an album or image in the default Zenphoto experience
     * @param path path to an album or image
     */
    public static zenphotoViewUrl(path: string): string {
        return 'https://tacocat.com/zenphoto/' + path;
    }

    /**
     * URL to the full Zenphoto image edit page
     */
    public static zenphotoImageEditUrl(imagePath: string): string {
        return 'https://tacocat.com/zenphoto/zp-core/admin-edit.php?page=edit&album=ALBUM_PATH&singleimage=IMAGE_FILENAME&tab=imageinfo&nopagination'
            .replace('ALBUM_PATH', encodeURIComponent(getParentFromPath(imagePath)))
            .replace('IMAGE_FILENAME', encodeURIComponent(getLeafItemOnPath(imagePath)));
    }

    /**
     * URL to edit the ablum in the default Zenphoto experience
     */
    public static zenphotoAlbumEditUrl(albumPath: string): string {
        return 'https://tacocat.com/zenphoto/zp-core/admin-edit.php?page=edit&album=' + encodeURIComponent(albumPath);
    }
}
