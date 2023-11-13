import type { Album } from '$lib/models/GalleryItemInterfaces';
import { isImagePath, isAlbumPath, getParentFromPath } from '$lib/utils/path-utils';

/**
 * Shape of function to retrieve an Album from its path.
 */
type GetAlbumFunction = (path: string) => Album | undefined;

/**
 * Given an arrow key press, return URL of next or previous photo or album to navigate to
 *
 * @param key the key from KeyboardEvent.key
 * @param path path to the current album or image
 * @returns path of album or image to navigate to, or null if do not navigate
 */
export function handleKeyboardNavigation(
    key: KeyboardEvent['key'],
    path: string,
    getAlbum: GetAlbumFunction,
): string | null {
    // get URL to navigate to
    let newPath = getUrlToNavigateTo(key, path, getAlbum);

    // make sure there's a / at root
    if (newPath != null && !newPath.startsWith('/')) {
        newPath = '/' + newPath;
    }

    return newPath;
}

/**
 * Given an arrow key press, return URL of next or previous photo or album to navigate to
 *
 * @param key the key from KeyboardEvent.key
 * @param path path to the current album or image
 * @returns path of album or image to navigate to, or null if do not navigate
 */
function getUrlToNavigateTo(key: KeyboardEvent['key'], path: string, getAlbum: GetAlbumFunction) {
    switch (key) {
        // left arrow: go to previous photo or album
        case 'ArrowLeft':
            return navigateToPeer(path, getAlbum, Direction.Prev);
        // right arrow: go to next photo or album
        case 'ArrowRight':
            return navigateToPeer(path, getAlbum, Direction.Next);
        // up arrow: go to parent album
        case 'ArrowUp':
            return navigateToParent(path);
        // down arrow: go to first child photo or child album
        case 'ArrowDown':
            return navigateToFirstChild(path, getAlbum);
        default:
            return null;
    }
}

enum Direction {
    Next,
    Prev,
}

/**
 * Return URL to next or prev photo
 *
 * @param path path to the current album or image
 * @param direction Next or Prev
 * @returns path of album or image to navigate to, or null if do not navigate
 */
function navigateToPeer(path: string, getAlbum: GetAlbumFunction, direction: Direction): string | null {
    // If on an album, go to prev/next album
    if (isAlbumPath(path)) {
        const album = getAlbum(path);
        if (album) {
            const newPath = direction === Direction.Next ? album.prevAlbumHref : album.nextAlbumHref; // album.prevAlbumHref and nextAlbumHref are backwards!
            if (newPath) {
                return newPath;
            }
        } else {
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
                const newPath = direction === Direction.Next ? image.nextImageHref : image.prevImageHref;
                if (newPath) {
                    return newPath;
                }
            } else {
                console.log('Did not find image [' + path + '] on album [' + albumPath + ']');
            }
        } else {
            console.log('No album found at path: ' + path);
        }
    } else {
        console.warn('Path is neither an image nor an album: ' + path);
    }

    return null;
}

/**
 * Return URL of parent album
 *
 * @param path path to the current album or image
 * @returns path of parent album, or null if do not navigate
 */
function navigateToParent(path: string): string | null {
    // If on an image, navigate to the album containing the image
    if (isImagePath(path)) {
        const albumPath: string = getParentFromPath(path);
        return albumPath;
    }
    // If on an album, navigate to parent album
    else if (isAlbumPath(path)) {
        const parentAlbumPath: string = getParentFromPath(path);
        return parentAlbumPath;
    } else {
        console.warn('Path is neither an image nor an album: ' + path);
    }

    return null;
}

/**
 * If on an album, navigate to first child photo or child album
 *
 * @param path path to the current album or image
 * @returns path of album or image to navigate to, or null if do not navigate
 */
function navigateToFirstChild(path: string, getAlbum: GetAlbumFunction): string | null {
    if (isAlbumPath(path)) {
        const album = getAlbum(path);
        if (album) {
            // If we're on an album with images, go to first image
            if (!!album.images && album.images.length > 0) {
                return album.images[0].path;
            }
            // Else we're on an album with no images, but subalbums.
            // Go to first subalbum.
            else if (!!album.albums && album.albums.length > 0) {
                return album.albums[0].path;
            }
        } else {
            console.log('No album found at path: ' + path);
        }
    }

    return null;
}
