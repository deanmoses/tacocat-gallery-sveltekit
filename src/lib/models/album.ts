/**
 * A photo album
 */
export interface Album {
    parentPath: string;
    itemName: string;
    /**
     * Path of the album, like '2001/12-31'
     */
    path: string;

    /**
     * Title of the album, like 'December 31, 2001'
     */
    title?: string;

    /**
     * Unprocessed album description / caption.
     * Use this to EDIT but not DISPLAY the description.
     * To display, use {@link Album#pageDescription}.
     * @see pageDescription
     */
    description?: string;

    /**
     * Album text suitable for display in the UI.
     * This rewrites legacy URLs (#2001/12-31) to current format (/2001/12-31)
     */
    get pageDescription(): string;

    /**
     * Short summary of the album, like 'Ski trip'
     */
    customdata?: string;

    /**
     * True: album is NOT available to the public
     */
    unpublished?: boolean;
    image_size?: number;
    thumb_size?: number;

    /**
     * URL of album's thumbnail photo.
     */
    url_thumb?: string;
    year?: number;
    next?: AlbumNavInfo;
    href?: string;
    nextAlbumHref?: string;
    nextAlbumTitle?: string;
    prevAlbumHref?: string;
    prevAlbumTitle?: string;
    parentAlbumHref?: string;
    parentAlbumTitle?: string;

    get pageTitle(): string;
    get date(): Date;
    get images(): Image[];
    get albums(): AlbumThumb[];

    getImage: (imagePath: string) => Image | undefined;
}

/**
 * An image in an album
 */
export interface Image extends Thumbable {
    nextImageHref?: string;
    prevImageHref?: string;
}

/**
 * Something that can be displayed as a thumbnail image
 */
export interface Thumbable {
    /**
     * Path of the album or image, like '2001/12-31'
     */
    path: string;
    parentPath: string;
    itemName: string;
    itemType: string;

    /**
     * Title of the album or image, like 'December 31, 2001'
     */
    title?: string;
    get pageTitle(): string;

    /**
     * Date of the album or image
     */
    date?: number;

    /**
     * Unprocessed album/image description/caption.
     * Use this to EDIT but not DISPLAY the description.
     * To display, use {@link Thumbable#pageDescription}.
     * @see pageDescription
     */
    description?: string;

    /**
     * Album text suitable for display in the UI.
     * This rewrites legacy URLs (#2001/12-31) to current format (/2001/12-31)
     */
    get pageDescription(): string;

    get href(): string;

    get thumbnailUrl(): string;

    url_full: string;
    url_sized: string;
    url_thumb: string;
    width: number;
    height: number;

    /**
     * Short summary of the album, like 'Ski trip'
     */
    customdata?: string;
}

/**
 * Just enough information to display an Album as a thumbnail image
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AlbumThumb extends Thumbable {}

/**
 * Just enough information to navigate to an Album
 */
export interface AlbumNavInfo {
    path: string;
    title?: string;
    date?: number;
}

/**
 * Just enough information to navigate to an Image
 */
export interface ImageNavInfo {
    path: string;
    title: string;
}

/**
 * Types of albums
 */
export enum AlbumType {
    ROOT = 'ROOT',
    YEAR = 'YEAR',
    DAY = 'DAY',
}

/**
 * Status of the initial load of the album
 */
export enum AlbumLoadStatus {
    /** The album has never been loaded and nobody's asked for it */
    NOT_LOADED = 'NOT_LOADED',
    /** The album has never been loaded but it's being retrieved */
    LOADING = 'LOADING',
    /** The album has never been loaded because there was an error loading the album. */
    ERROR_LOADING = 'ERROR_LOADING',
    /** The album definitely does not exist */
    DOES_NOT_EXIST = 'DOES_NOT_EXIST',
    /** The album has been loaded */
    LOADED = 'LOADED',
}

/**
 * Status of subsequent updates to the album
 *
 * Update status is different than load status: updates are AFTER the
 * initial album has loaded.  You are refreshing the existing album.
 */
export enum AlbumUpdateStatus {
    NOT_UPDATING = 'NOT_UPDATING',
    UPDATING = 'UPDATING',
    ERROR_UPDATING = 'ERROR_UPDATING',
}
