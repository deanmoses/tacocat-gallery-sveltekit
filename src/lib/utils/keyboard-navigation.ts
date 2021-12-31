import { Store } from 'redux';
import { isImagePath, isAlbumPath, getParentFromPath } from '$lib/utils/path-utils';
import { getAlbum } from '$lib/redux/selectors/album-selectors';
import { isInEditMode } from '$lib/redux/selectors/edit-mode-selectors';

/**
 * Handle arrow presses by navigating to next and previous photos
 *
 * @param store the root Redux store
 * @param event the keyboard event
 */
export function handleKeyboardNavigation(store: Store<any>, event: KeyboardEvent): void {
	if (event.defaultPrevented) {
		return;
	}

	// Disable keyboard navigation when in edit mode:
	// the user needs the arrow keys to navigate within
	// the text they're editing.
	if (isInEditMode(store.getState())) {
		return;
	}

	const key = event.key || event.keyCode;

	// left arrow, go to previous photo or album
	if (key === 'ArrowLeft' || key === 37) {
		navigateToPeer(store, Direction.Prev);
	}
	// right arrow, go to next photo or album
	else if (key === 'ArrowRight' || key === 39) {
		navigateToPeer(store, Direction.Next);
	}
	// up arrow, go to parent album
	else if (key === 'ArrowUp' || key === 38) {
		navigateToParent();
	}
	// down arrow, go to first child photo or child album
	else if (key === 'ArrowDown' || key === 40) {
		navigateToFirstChild(store);
	}
}

enum Direction {
	Next = 1,
	Prev
}

/**
 * Navigate to next photo
 * 
 * @param store the root Redux store
 * @param direction Next or Prev
 */
function navigateToPeer(store: Store<any>, direction: Direction) {
	const path: string = getPathFromUrl();

	// If on an album, go to prev/next album
	if (isAlbumPath(path)) {
		const album = getAlbum(store.getState(), path);
		if (!!album) {
			const newPath = (direction === Direction.Next) ? album.prevAlbumHref : album.nextAlbumHref; // album.prevAlbumHref and nextAlbumHref are backwards!
			if (!!newPath) {
				setPathOnUrl(newPath);
			}
		}
		else {
			console.log('No album found at path: ' + path);
		}
	}
	// If on an image, go to prev/next image
	else if (isImagePath(path)) {
		const albumPath: string = getParentFromPath(path);
		const album = getAlbum(store.getState(), albumPath);
		if (!!album) {
			const image = album.getImage(path);
			if (!!image) {
				const newPath = (direction === Direction.Next) ? image.nextImageHref : image.prevImageHref;
				if (!!newPath) {
					setPathOnUrl(newPath);
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
}

/**
 * Navigate to parent album
 */
function navigateToParent() {
	const path: string = getPathFromUrl();

	// If on an image, navigate to the album containing the image
	if (isImagePath(path)) {
		const albumPath: string = getParentFromPath(path);
		setPathOnUrl(albumPath);
	}
	// If on an album, navigate to parent album
	else if (isAlbumPath(path)) {
		const parentAlbumPath: string = getParentFromPath(path);
		setPathOnUrl(parentAlbumPath);
	}
	else {
		console.log('URL is neither an image nor an album: ' + path);
	}
}

/**
 * If on an album, navigate to first child photo or child album
 * 
 * @param store the root Redux store
 */
function navigateToFirstChild(store: Store<any>) {
	const path: string = getPathFromUrl();

	if (isAlbumPath(path)) {
		const album = getAlbum(store.getState(), path);
		if (!!album) {
			// If we're on an album with images, go to first image
			if (!!album.images && album.images.length > 0) {
				setPathOnUrl(album.images[0].path);
			}
			// Else we're on an album with no images, but subalbums.
			// Go to first subalbum.
			else if (!!album.albums && album.albums.length > 0) {
				setPathOnUrl(album.albums[0].path);
			}
		}
		else {
			console.log('No album found at path: ' + path);
		}
	}
}

/**
 * Return the current album or photo path from the browser URL
 */
function getPathFromUrl(): string {
	return window.location.hash.replace('#', '');
}

/**
 * Set the URL to a new album or photo
 * 
 * @param path the new album or photo path
 */
function setPathOnUrl(path: string): void {
	window.location.hash = path;
}