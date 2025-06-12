import { describe, it, expect } from 'vitest';
import { toTitleFromFilename } from '../titleUtils';

const titles: { in: string; out: string }[] = [
    {
        in: '',
        out: '',
    },
    {
        in: 'image.jpg',
        out: 'Image',
    },
    {
        in: 'image.jpeg',
        out: 'Image',
    },
    {
        in: 'image.png',
        out: 'Image',
    },
    {
        in: 'image.JPG',
        out: 'Image',
    },
    {
        in: 'image1.jpg',
        out: 'Image',
    },
    {
        in: 'image_1.jpg',
        out: 'Image',
    },
    {
        in: 'image-1.jpg',
        out: 'Image',
    },
    {
        in: 'image1b.jpg',
        out: 'Image',
    },
    {
        in: 'image_1B.jpg',
        out: 'Image',
    },

    {
        in: 'Image.jpg',
        out: 'Image',
    },
    {
        in: 'image',
        out: 'Image',
    },
    {
        in: 'two_words.jpg',
        out: 'Two Words',
    },
    {
        in: 'two-words.jpg',
        out: 'Two Words',
    },
    {
        in: 'three_whole_words.jpg',
        out: 'Three Whole Words',
    },
    {
        in: '1love.jpg',
        out: 'Love',
    },
    {
        in: 'IMAGE.jpg',
        out: 'IMAGE',
    },
];

describe('toTitleFromFilename', () => {
    titles.forEach((title) => {
        it(`should convert [${title.in}] to [${title.out}]`, () => {
            expect(toTitleFromFilename(title.in)).toBe(title.out);
        });
    });
});
