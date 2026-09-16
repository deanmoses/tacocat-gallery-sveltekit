import { describe, it, expect } from 'vitest';
import { handleKeyboardNavigation } from './keyboard-navigation';
import toAlbum from '$lib/models/impl/AlbumCreator';
import type { Album } from '$lib/models/GalleryItemInterfaces';
import { albumRecord, dayAlbum, imageRecord, mediaPath } from '$lib/test-support/records';

/**
 * What the arrow keys do from each kind of page, given what is in memory.
 *
 * The path is what the browser's address bar holds: no trailing slash on an
 * album. The store is stood in for by a map, since all the handler asks of it
 * is an album by path.
 */
const image = (name: string) => imageRecord({ itemType: 'image', path: mediaPath(name), itemName: name });
const day = (name: string) => albumRecord({ path: `/2001/${name}/`, parentPath: '/2001/', itemName: name });
const year = (name: string) => albumRecord({ path: `/${name}/`, parentPath: '/', itemName: name });

const IN_MEMORY = new Map<string, Album>([
    ['/', toAlbum(albumRecord({ path: '/', parentPath: '', itemName: '', children: ['2000', '2001'].map(year) }))],
    ['/2001/', toAlbum(albumRecord({ children: ['01-01', '12-31'].map(day) }))],
    ['/2001/12-31/', dayAlbum(['a.jpg', 'b.jpg', 'c.jpg'].map(image))],
]);
const getAlbum = (path: string) => IN_MEMORY.get(path);

type Case = { key: string; from: string; goesTo: string | null };

// Albums are paged through newest first, so the right arrow goes to the older one
const CASES: Case[] = [
    { key: 'ArrowRight', from: '/2001/12-31', goesTo: '/2001/01-01' },
    { key: 'ArrowLeft', from: '/2001/01-01', goesTo: '/2001/12-31' },
    { key: 'ArrowRight', from: '/2001/01-01', goesTo: null },
    { key: 'ArrowLeft', from: '/2001/12-31', goesTo: null },
    { key: 'ArrowRight', from: '/2001', goesTo: '/2000' },
    { key: 'ArrowLeft', from: '/2000', goesTo: '/2001' },
    { key: 'ArrowRight', from: '/', goesTo: null },
    // A day whose year is not in memory has no known neighbours
    { key: 'ArrowRight', from: '/2002/01-01', goesTo: null },
    { key: 'ArrowRight', from: '/2001/12-31/b.jpg', goesTo: '/2001/12-31/c.jpg' },
    { key: 'ArrowLeft', from: '/2001/12-31/b.jpg', goesTo: '/2001/12-31/a.jpg' },
    { key: 'ArrowRight', from: '/2001/12-31/c.jpg', goesTo: null },
    { key: 'ArrowUp', from: '/2001/12-31/b.jpg', goesTo: '/2001/12-31/' },
    { key: 'ArrowUp', from: '/2001/12-31', goesTo: '/2001/' },
    { key: 'ArrowDown', from: '/2001/12-31', goesTo: '/2001/12-31/a.jpg' },
    { key: 'ArrowDown', from: '/2001', goesTo: '/2001/01-01/' },
    { key: 'Enter', from: '/2001/12-31', goesTo: null },
];

describe(handleKeyboardNavigation, () => {
    it.each(CASES)('$key from $from goes to $goesTo', ({ key, from, goesTo }) => {
        expect(handleKeyboardNavigation(key, from, getAlbum)).toBe(goesTo);
    });
});
