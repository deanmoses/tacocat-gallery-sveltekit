/**
 * A photo album
 */
export interface Album {
	path: string;
	title?: string;
	 
	/**
	 * Used by tacocat.com as a short summary of the album
	 */
	customdata?: string;
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
	 * Return image at specified path, or null
	 */
	getImage?: (imagePath: string) => Image;
};

/**
 * Something that can be displayed as a thumbnail image
 */
export interface Thumbable {
	path: string;
	title: string;
	date: number;
	desc: string;
	url_full: string;
	url_sized: string;
	url_thumb: string;
	width: number;
	height: number;
	customdata?: string;
};

/**
 * Enough information to display an Album as a thumbnail image
 */
export interface AlbumThumb extends Thumbable { };

/**
 * An image in an album
 */
export interface Image extends Thumbable {
	nextImageHref: string;
	prevImageHref: string;
};

/**
 * Enough information to navigate to an Album
 */
export interface AlbumNavInfo {
	path?: string;
	title?: string;
	date?: number;
};

/**
 * Enough information to navigate to an Image
 */
export interface ImageNavInfo {
	path: string;
	title: string;
};

/**
 * Types of albums
 * TODO: I really want to get rid of this:
 * 1) The root concept (Album) should not know about its children.
 * 2) If I want to add new types of albums, new renderers, I shouldn't have to touch the data model.
 */
export enum AlbumType {
	ROOT = 'ROOT',
	YEAR = 'YEAR',
	DAY = 'DAY'
};