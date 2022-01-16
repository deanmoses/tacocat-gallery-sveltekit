import { goto } from '$app/navigation';
import type { Album } from '$lib/models/album';
import { albumStore } from '$lib/stores/AlbumStore';
import { isImagePath, isAlbumPath, getParentFromPath } from '$lib/utils/path-utils';

/**
 * Handle arrow presses by navigating to next and previous photos
 *
 * @param key the key from KeyboardEvent.key
 * @param path path to the current album or image
 */
export function handleKeyboardNavigation(key: KeyboardEvent["key"], path: string): void {
	switch (key) {
		// left arrow: go to previous photo or album
		case 'ArrowLeft':
			navigateToPeer(path, Direction.Prev);
			break;
		// right arrow: go to next photo or album
		case 'ArrowRight':
			navigateToPeer(path, Direction.Next);
			break;
		// up arrow: go to parent album
		case 'ArrowUp':
			navigateToParent(path);
			break;
		// down arrow: go to first child photo or child album
		case 'ArrowDown':
			navigateToFirstChild(path);
	}
}

enum Direction {
	Next,
	Prev
}

/**
 * Navigate to next or prev photo
 * 
 * @param path path to the current album or image
 * @param direction Next or Prev
 */
function navigateToPeer(path: string, direction: Direction) {
	// If on an album, go to prev/next album
	if (isAlbumPath(path)) {
		const album = getAlbum(path);
		if (album) {
			const newPath = (direction === Direction.Next) ? album.prevAlbumHref : album.nextAlbumHref; // album.prevAlbumHref and nextAlbumHref are backwards!
			if (newPath) {
				navigate(newPath);
			}
		}
		else {
			console.log('No album found at path: ' + path);
		}
	}
	// If on an image, go to prev/next image
	else if (isImagePath(path)) {
		const albumPath: string = getParentFromPath(path);
		const album = getAlbum(albumPath);
		if (album) {
			const image = album.getImage(path);
			if (image) {
				const newPath = (direction === Direction.Next) ? image.nextImageHref : image.prevImageHref;
				if (newPath) {
					navigate(newPath);
				}
			}
			else {
				console.log('Did not find image [' + path + '] on album [' + albumPath + ']');
			}
		}
		else {
			console.log('No album found at path: ' + path);
		}
	}
	else {
		console.log('Path is neither an image nor an album: ' + path);
	}
}

/**
 * Navigate to parent album
 * 
 * @param path path to the current album or image
 */
function navigateToParent(path: string) {

	// If on an image, navigate to the album containing the image
	if (isImagePath(path)) {
		const albumPath: string = getParentFromPath(path);
		navigate(albumPath);
	}
	// If on an album, navigate to parent album
	else if (isAlbumPath(path)) {
		const parentAlbumPath: string = getParentFromPath(path);
		navigate(parentAlbumPath);
	}
	else {
		console.log('Path is neither an image nor an album: ' + path);
	}
}

/**
 * If on an album, navigate to first child photo or child album
 * 
 * @param path path to the current album or image
 */
function navigateToFirstChild(path: string) {

	if (isAlbumPath(path)) {
		const album = getAlbum(path);
		if (album) {
			// If we're on an album with images, go to first image
			if (!!album.images && album.images.length > 0) {
				navigate(album.images[0].path);
			}
			// Else we're on an album with no images, but subalbums.
			// Go to first subalbum.
			else if (!!album.albums && album.albums.length > 0) {
				navigate(album.albums[0].path);
			}
		}
		else {
			console.log('No album found at path: ' + path);
		}
	}
}

/**
 * Get album from store
 * 
 * @param path path to album 
 */
function getAlbum(path: string): Album {
	return albumStore.getFromInMemory(path);
}

/**
 * Navigate to the album or photo
 * 
 * @param path path of the album or photo
 */
function navigate(path: string): void {
	if (!path.startsWith('/')) {
		path = '/' + path;
	}
	goto(path);
}