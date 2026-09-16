import { describe, it, expect, afterEach, vi } from 'vitest';
import { currentYearAlbumPath, latestAlbum } from './latestAlbum';
import toAlbum from '$lib/models/impl/AlbumCreator';
import type { Album } from '$lib/models/GalleryItemInterfaces';
import { albumRecord } from '$lib/test-support/records';

/**
 * A year's child list as the server sends it: oldest first. A guest's copy
 * holds only published albums; an admin's holds all of them, so the published
 * flag is what these rows vary.
 */
type Day = { name: string; published: boolean };

function yearAlbum(days: Day[]): Album {
    return toAlbum(
        albumRecord({
            children: days.map(({ name, published }) =>
                albumRecord({ path: `/2001/${name}/`, parentPath: '/2001/', itemName: name, published }),
            ),
        }),
    );
}

type Case = { name: string; year: Album | undefined; latest: string | undefined };

const CASES: Case[] = [
    {
        name: 'the newest album when every album is published',
        year: yearAlbum([
            { name: '01-01', published: true },
            { name: '12-31', published: true },
        ]),
        latest: '/2001/12-31/',
    },
    {
        name: 'the newest published album, past newer unpublished ones',
        year: yearAlbum([
            { name: '01-01', published: true },
            { name: '06-15', published: true },
            { name: '12-31', published: false },
        ]),
        latest: '/2001/06-15/',
    },
    {
        name: 'nothing when no album is published',
        year: yearAlbum([{ name: '01-01', published: false }]),
        latest: undefined,
    },
    { name: 'nothing when the year has no albums', year: yearAlbum([]), latest: undefined },
    { name: 'nothing when the year has not loaded', year: undefined, latest: undefined },
];

describe(latestAlbum, () => {
    it.each(CASES)('is $name', ({ year, latest }) => {
        expect(latestAlbum(year)?.path).toBe(latest);
    });
});

describe(currentYearAlbumPath, () => {
    afterEach(() => vi.useRealTimers());

    it('is the year album of the year it is now', () => {
        vi.useFakeTimers({ now: new Date(2001, 5, 15) });

        expect(currentYearAlbumPath()).toBe('/2001/');
    });
});
