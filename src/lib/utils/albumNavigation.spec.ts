import { describe, it, expect } from 'vitest';
import { albumNav } from './albumNavigation';
import { shortDate } from './date-utils';
import toAlbum from '$lib/models/impl/AlbumCreator';
import type { Album } from '$lib/models/GalleryItemInterfaces';
import { albumRecord } from '$lib/test-support/records';

/**
 * A parent's child list as the server sends it: oldest first, already filtered
 * to what the viewer may see. So whether a neighbour is unpublished never
 * comes up here; it is the server's list that decides.
 */
function yearAlbum(days: string[]): Album {
    return toAlbum(
        albumRecord({
            children: days.map((day) => albumRecord({ path: `/2001/${day}/`, parentPath: '/2001/', itemName: day })),
        }),
    );
}

function rootAlbum(years: string[]): Album {
    return toAlbum(
        albumRecord({
            path: '/',
            parentPath: '',
            itemName: '',
            children: years.map((year) => albumRecord({ path: `/${year}/`, parentPath: '/', itemName: year })),
        }),
    );
}

const YEAR = yearAlbum(['01-01', '06-15', '12-31']);
const ROOT = rootAlbum(['2000', '2001', '2002']);

// Day titles go through the locale formatter, so the machine running the spec
// decides their text. Which album a title names is the assertion.
const JAN_1 = shortDate(new Date(2001, 0, 1));
const JUN_15 = shortDate(new Date(2001, 5, 15));
const DEC_31 = shortDate(new Date(2001, 11, 31));

type Case = {
    name: string;
    albumPath: string;
    parent: Album | undefined;
    prevHref?: string;
    nextHref?: string;
    prevTitle?: string;
    nextTitle?: string;
};

const CASES: Case[] = [
    {
        name: 'a day between two others',
        albumPath: '/2001/06-15/',
        parent: YEAR,
        prevHref: '/2001/01-01',
        prevTitle: JAN_1,
        nextHref: '/2001/12-31',
        nextTitle: DEC_31,
    },
    { name: 'the oldest day', albumPath: '/2001/01-01/', parent: YEAR, nextHref: '/2001/06-15', nextTitle: JUN_15 },
    { name: 'the newest day', albumPath: '/2001/12-31/', parent: YEAR, prevHref: '/2001/06-15', prevTitle: JUN_15 },
    { name: 'an only child', albumPath: '/2001/06-15/', parent: yearAlbum(['06-15']) },
    // A day the parent does not list: created since the parent was fetched, or
    // unpublished and being viewed by an admin through a guest's copy of the parent
    { name: 'a day its parent does not list', albumPath: '/2001/03-03/', parent: YEAR },
    { name: 'a day whose parent has not loaded', albumPath: '/2001/06-15/', parent: undefined },
    {
        name: 'a year between two others',
        albumPath: '/2001/',
        parent: ROOT,
        prevHref: '/2000',
        prevTitle: '2000',
        nextHref: '/2002',
        nextTitle: '2002',
    },
    { name: 'the root', albumPath: '/', parent: undefined },
];

describe(albumNav, () => {
    it.each(CASES)('$name', ({ albumPath, parent, prevHref, nextHref, prevTitle, nextTitle }) => {
        expect(albumNav(albumPath, parent)).toStrictEqual({ prevHref, nextHref, prevTitle, nextTitle });
    });
});
