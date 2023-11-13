import { AlbumUpdateStatus } from '$lib/models/album';
import type { AlbumGalleryItem } from '$lib/models/server';
import { type AlbumEntry, albumStore } from '$lib/stores/AlbumStore';
import Config from '$lib/utils/config';
import { getParentFromPath } from '$lib/utils/galleryPathUtils';
import { produce } from 'immer';

/**
 * Set specified thumbnail as specified album's thumbnail
 *
 * @param albumPath path of album I'm setting the thumbnail on
 * @param thumbnailLeafPath leaf path of the thumbnail item, like 'felix.jpg'
 */
export function setAlbumThumbnail(albumPath: string, thumbnailLeafPath: string): void {
    console.log(`Album [${albumPath}] setting thumbnail [${thumbnailLeafPath}]`);

    // Update store state to "Saving..."
    albumStore.setUpdateStatus(albumPath, AlbumUpdateStatus.UPDATING);

    // Make the save request
    const saveUrl = Config.saveUrl(albumPath);
    const requestConfig = buildRequestConfig(thumbnailLeafPath);
    fetch(saveUrl, requestConfig)
        .then(checkForErrors)
        .then((response) => response.json())
        .then((json) => checkJsonForErrors(json, albumPath))
        .then((thumbnailUrl) => updateThumbOnAlbum(thumbnailUrl, albumPath))
        .then((thumbnailUrl) => updateThumbOnParentAlbum(thumbnailUrl, albumPath))
        .catch((error) => errorAction(error, albumPath, thumbnailLeafPath))
        .finally(() => albumStore.setUpdateStatus(albumPath, AlbumUpdateStatus.NOT_UPDATING));
}

/**
 * Create the configuration for the save request
 */
function buildRequestConfig(thumbnailLeafPath: string): RequestInit {
    // The body of the form I will be sending to the server
    const formData = new FormData();
    formData.append('eip_context', 'album');
    formData.append('thumb', thumbnailLeafPath);

    // Save draft to server
    const requestConfig: RequestInit = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
        },
        body: formData,
        // no-store: bypass the HTTP cache completely.
        // This will make the browser not look into the HTTP cache
        // on the way to the network, and never store the resulting
        // response in the HTTP cache.
        // Fetch() will behave as if no HTTP cache exists.
        cache: 'no-store',
        credentials: 'include',
    };

    return requestConfig;
}

/**
 * Check for errors in response and throw exception if found
 */
function checkForErrors(response: Response): Response {
    // TODO: instead of simply checking ok, return a structured FetchError with a NotFound type, etc
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}

/**
 * Check that the JSON coming back from the save response indicates success.
 *
 * @param json response from server
 * @param albumPath path of album whose thumbnail has changed
 * @param thumbnailLeafPath leaf path of the thumbnail item, like 'felix.jpg'
 * @returns URL of new thumbnail
 * @throws error if there was anything but a success returned
 */
function checkJsonForErrors(json: any, albumPath: string): string {
    if (!json || !json.success) {
        if (json.message) {
            throw new Error(
                `Album [${albumPath}] server did not respond with success saving thumbnail: "${json.message}"`,
            );
        } else {
            throw new Error(`Album [${albumPath}] server did not respond with success saving thumbnail`);
        }
    }

    const thumbnailUrl = json.urlThumb;
    if (!thumbnailUrl) {
        throw new Error(`Album [${albumPath}]: did not get thumbnail URL back from server`);
    }

    console.log(`Album [${albumPath}] thumbnail save success.  New thumbnail URL: [${thumbnailUrl}]`);

    return thumbnailUrl;
}

/**
 * There was an error saving the thumbnail. Handle it.
 *
 * @param error error that occurred somewhere while attempting to set thumbnail to server
 * @param albumPath path of album whose thumbnail has changed
 * @param thumbnailLeafPath leaf path of the thumbnail item, like 'felix.jpg'
 */
function errorAction(error: Error, albumPath: string, thumbnailLeafPath: string): void {
    console.error(`Album [${albumPath}]: error saving thumbnail [${thumbnailLeafPath}].  Error:`, error);
    window.alert(`Error saving thumbnail: ${error.message}`);
}

/**
 * New album thumbnail was saved to server.  Update it in store.
 *
 * TODO: this should be part of the Album concerns, not this helper's concerns.
 * That's how it was in React, it was on the album reducer.
 *
 * @returns the thumbnail URL
 */
function updateThumbOnAlbum(thumbnailUrl: string, albumPath: string): string {
    // Get album from store
    const albumEntry: AlbumEntry | null = albumStore.getFromInMemory(albumPath);
    if (!albumEntry) throw new Error(`Did not find album entry [${albumPath}] in memory`);
    if (!albumEntry.album)
        throw new Error(`Did not find album [${albumPath}] in memory: entry exists but it has no album`);

    // Make a copy of the album entry.  Apply changes to the copy
    const updatedAlbumEntry = produce(albumEntry, (albumEntryCopy) => {
        if (albumEntryCopy.album === undefined) throw new Error('albumEntryCopy.album undefined');
        albumEntryCopy.album.thumbnailUrl = thumbnailUrl;
    });

    // Update album in store
    // This also writes the album to the browser's local disk cache;
    // otherwise, next page load the value will be wrong
    albumStore.updateAlbumEntry(updatedAlbumEntry);

    return thumbnailUrl;
}

/**
 * Update the thumb on this album's entry within its parent album, if the parent album has been downloaded
 */
function updateThumbOnParentAlbum(thumbnailUrl: string, albumPath: string): void {
    // Get parent album from store
    const parentAlbumPath = getParentFromPath(albumPath);
    const albumEntry: AlbumEntry | null = albumStore.getFromInMemory(albumPath);

    // Don't bother updating parent if it hasn't been downloaded
    // TODO: we do still need to update the version in IndexedDB, right?
    // Otherwise next time we fetch from IndexedDB it'll be wrong
    if (!albumEntry || !albumEntry.album || !albumEntry.album.albums) {
        return;
    }

    // Make a copy of the album entry.  Apply changes to the copy
    const updatedAlbumEntry = produce(albumEntry, (albumEntryCopy) => {
        // find album on parent
        const thumbOnParent: AlbumGalleryItem | undefined = albumEntryCopy.album?.albums.find(
            (childThumb: AlbumGalleryItem) => {
                return childThumb.path === albumPath;
            },
        );
        // Did I find album within parent album?
        // Never expect this to happen, just defensive programming
        if (!thumbOnParent) {
            throw new Error(`Did not find album ${albumPath} in parent album ${parentAlbumPath}`);
        }

        // Found it.  Set thumb
        thumbOnParent.thumbnail = {
            path: thumbnailUrl,
            fileUpdatedOn: new Date().toISOString(), // TODO: I should not be setting a random date here to get the file to compile without warnings
        };
    });

    // Update album in store
    // This also writes the album to the browser's local disk cache;
    // otherwise, next page load the value will be wrong
    albumStore.updateAlbumEntry(updatedAlbumEntry);
}
