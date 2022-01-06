//
// Interfaces for the application state
//

/**
 * A data store of albums retrievable by their path
 */
export type AlbumsByPath = {
	[albumPath: string]: Album;
};

/**
 * A data store of draft edits of both albums and images,
 * retrievable by the path of that album or image
 */
export type DraftsByPath = {
	[path: string]: Draft;
};

/**
 * An unsaved draft edit of an album or an image
 */
export type Draft = {
	path: string;
	state?: DraftState;
	content?: DraftContent;
	errorMessage?: string;
};
export enum DraftState {
	UNSAVED_CHANGES = 'UNSAVED_CHANGES',
	SAVING = 'SAVING',
	SAVED = 'SAVED',
	ERRORED = 'ERRORED'
};
//export type DraftContent = Album | Image;
export type DraftContent = {
	title?: string;
	desc?: string;
};

/**
 * A data store of search results,
 * retrievably by their search terms.
 */
export type SearchesBySearchTerms = {
	[searchTerms: string]: Search;
};

/**
 * A set of search results for a particular set of search terms
 */
export type Search = {
	results?: any;
	state?: SearchState;
	errorMessage?: string;
};

export enum SearchState {
	SEARCHING = 'SEARCHING',
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR'
};

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
	isLoading?: boolean;
	err?: FetchError;
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

/**
 * Error for fetching from server
 */
export interface FetchError {
	/**
	 * Suitable for display to end user
	 */
	message: string;

	/**
	 * Type of error
	 */
	type: FetchErrorType;
};

/**
 * Types of errors that fetching from server can generate
 */
export enum FetchErrorType {
	NotFound = 'NotFound',
	Other = 'Other'
};

export class FetchErrorImpl implements FetchError {
	message: string;
	type: FetchErrorType;

	constructor(message: string, type?: FetchErrorType) {
		this.message = message;
		this.type = type ? type : FetchErrorType.Other;
	}
};
