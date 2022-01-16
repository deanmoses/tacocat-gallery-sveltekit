import { AlbumType } from '$lib/models/album';

const dateBasedPathRegex = /^\/?(\d\d\d\d)\/?(\d\d-\d\d)?(\/[^\/\.]+\.[^\/\.]{3,4})?\/?$/; // finds 2000 or 2000/12-31 or 2000/12-31/someImage.jpg
const yearRegex = /^\/?(\d\d\d\d)\/?$/

/**
 * Return the year (like 2001) from a path (like 2001/12-31/myImage.jpg)
 *
 * @param path Path to an image or an album
 * @return numerical year or null if the path can't be parsed into a number
 */
export function getYearFromPath(path: string): number {
	const regexResults = dateBasedPathRegex.exec(path);
	if (regexResults) {
		const year = Number(dateBasedPathRegex.exec(path)[1]);
		return !isNaN(year) ? year : null;
	} else {
		return null;
	}
}

/**
 * Return the parent path from the given path.  For example:
 *  - If the path is an image, it returns the album the image is in.
 *  - If the path is an album, it returns the parent album the child is in.
 *  - If the path is an album off the root like "2000", it returns ''
 *  - If the path is the root album (the gallery itself), it throws an exception.
 */
export function getParentFromPath(path: string): string {
	if (!path || path === '/') throw new Error('Root album has no parent');
	// get the album's path from the photo's path
	const pathParts = path.split('/');
	pathParts.pop(); // remove photo filename
	return pathParts.join('/');
}

/**
 * Return the leaf item on the given path.  For example:
 * - If the path is an image like 2001/12-31/photo.jpg, it returns photo.jpg
 * - If the path is an album like 2001/12-31, it returns 12-31
 * - If the path is 2001, it returns 2001
 * - If the path is empty, it return empty
 */
export function getLeafItemOnPath(path: string): string {
	return path.split('/').pop(); // we just want 'felix.jpg'
}

/**
 * Return true if specified path is to an image (instead of an album)
 * @argument path path of an image or an album
 */
export function isImagePath(path: string): boolean {
	return !!path && path.indexOf('.') > 0;
}

/**
 * Return true if specified path is to an album (instead of an image)
 * @argument path path of an image or an album
 */
export function isAlbumPath(path: string): boolean {
	return !isImagePath(path);
}

/**
 * @param path path of an album
 * @returns true if path is for a root album
 */
export function isRootAlbumPath(path: string): boolean {
	return !path || path.length <= 0 || path === '/';
}

/**
 * @param path of an album
 * @returns true if path is for a year album 
 */
export function isYearAlbumPath(path: string): boolean {
	return yearRegex.test(path)
}

/**
 * Return the type of album.  If it's an image, throws exception
 * @param path path of an album
 */
export function getAlbumType(path: string): AlbumType {
	if (isRootAlbumPath(path)) {
		return AlbumType.ROOT;
	}
	else if (isYearAlbumPath(path)) {
		return AlbumType.YEAR;
	}
	else if (isImagePath(path)) {
		throw Error(`This is an image path, not an album: ${path}`);
	}
	else {
		// else it's a day album (like /2005/12-31)
		return AlbumType.DAY;
	}
}

/**
 * @param path path not in edit mode, like /2001/12-31
 * @returns the edit version of the URL, like /edit/2001/12-31
 */
export function editUrl(path: string): string {
	console.log('Edit URL: ', `/edit${path}`);
	return path ? `/edit${path}` : null;
}

/**
 * @param path path in edit mode, like /edit/2001/12-31
 * @returns the non-edit version of the URL, like /2001/12-31
 */
export function unEditUrl(path: string): string {
	return path.replace(/^\/edit/, '');
}