/**
 * A photo album
 */
export interface Album {
	/**
	 * Path of the album, like '2001/12-31'
	 */
	path: string;

	/**
	 * Title of the album, like 'December 31, 2001'
	 */
	title?: string;

	/**
	 * Short summary of the album, like 'Ski trip'
	 */
	customdata?: string;

	/**
	 * Album text / photo caption.
	 *
	 * Use this instead of the #desc property when
	 * displaying in the UI because this rewrites legacy
	 * URL formats.
	 *
	 * @see desc
	 */
	description: string;

	/**
	 * Unprocessed album text / photo caption.
	 *
	 * Don't display this in the UI; instead use the #description property.
	 *
	 * This exists because it's set directly from the JSON API.
	 *
	 * @see description
	 */
	desc?: string;

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
	date?: number;
	year?: number;
	images?: Image[];
	albums?: AlbumThumb[];
	parent_album?: AlbumNavInfo;
	next?: AlbumNavInfo;
	pageTitle?: string;
	href?: string;
	nextAlbumHref?: string;
	nextAlbumTitle?: string;
	prevAlbumHref?: string;
	prevAlbumTitle?: string;
	parentAlbumHref?: string;
	parentAlbumTitle?: string;

	/**
	 * Return image at specified path, or undefined
	 */
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

	/**
	 * Title of the album or image, like 'December 31, 2001'
	 */
	title: string;

	/**
	 * Date of the album or image
	 */
	date: number;

	/**
	 * Album text / photo caption
	 */
	description: string;
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
	path?: string;
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
	DAY = 'DAY'
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
	LOADED = 'LOADED'
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
	ERROR_UPDATING = 'ERROR_UPDATING'
}
