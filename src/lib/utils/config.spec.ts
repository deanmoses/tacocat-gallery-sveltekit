import { describe, expect, it } from 'vitest';
import { thumbnailSrcset, thumbnailUrl } from './config';

const PATH = '/2001/12-31/felix.jpg';
const VERSION = 'v1';
const CROP = { x: 0, y: 20, width: 300, height: 300 };
const CDN = 'https://img.pix.tacocat.com/i';

type ThumbnailCase = {
    name: string;
    crop: typeof CROP | undefined;
    query: string;
};

const CASES: ThumbnailCase[] = [
    { name: 'uncropped', crop: undefined, query: '' },
    { name: 'cropped', crop: CROP, query: '&crop=0,20,300,300' },
];

describe(thumbnailUrl, () => {
    it.each(CASES)('asks for a 200x200 WebP, $name', ({ crop, query }) => {
        expect(thumbnailUrl(PATH, VERSION, crop)).toBe(
            `${CDN}${PATH}?version=${VERSION}&size=200x200&format=webp${query}`,
        );
    });
});

describe(thumbnailSrcset, () => {
    it.each(CASES)('offers the same frame at 200 for 1x and 400 for 2x, $name', ({ crop, query }) => {
        expect(thumbnailSrcset(PATH, VERSION, crop)).toBe(
            `${CDN}${PATH}?version=${VERSION}&size=200x200&format=webp${query} 1x, ` +
                `${CDN}${PATH}?version=${VERSION}&size=400x400&format=webp${query} 2x`,
        );
    });
});
