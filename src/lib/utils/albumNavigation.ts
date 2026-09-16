import type { Album } from '$lib/models/GalleryItemInterfaces';
import { shortDate } from './date-utils';
import { albumPathToDate, isValidDayAlbumPath } from './galleryPathUtils';

/** Where an album page's prev and next buttons lead */
export type AlbumNav = {
    prevHref: string | undefined;
    nextHref: string | undefined;
    prevTitle: string | undefined;
    nextTitle: string | undefined;
};

/**
 * An album's neighbours are the children on either side of it in its parent.
 * The server has already filtered the parent's child list to what this viewer
 * may see, so an unpublished album is a neighbour to an admin and skipped over
 * for a guest. Without the parent there are no neighbours, which leaves the
 * buttons disabled until it arrives.
 */
export function albumNav(albumPath: string, parent: Album | undefined): AlbumNav {
    const siblings = parent?.albums ?? [];
    const index = siblings.findIndex((sibling) => sibling.path === albumPath);
    const prev = index < 0 ? undefined : siblings[index - 1];
    const next = index < 0 ? undefined : siblings[index + 1];
    return {
        prevHref: prev?.href,
        nextHref: next?.href,
        prevTitle: prev ? navTitle(prev.path) : undefined,
        nextTitle: next ? navTitle(next.path) : undefined,
    };
}

/** A day album is titled by its month and day, a year album by its year */
function navTitle(albumPath: string): string {
    const date = albumPathToDate(albumPath);
    return isValidDayAlbumPath(albumPath) ? shortDate(date) : date.getFullYear().toString();
}
