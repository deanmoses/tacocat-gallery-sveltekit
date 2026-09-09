import { describe, it, expect } from 'vitest';
import { toTitleFromFilename } from './titleUtils';

/**
 * A media item with no title of its own is displayed under one made from its
 * filename, so this runs over whatever a camera, a phone or an export wrote.
 */
type TitleCase = { fileName: string; title: string };

const CASES: TitleCase[] = [
    // Only the last extension is dropped, whatever it is
    { fileName: 'image.jpg', title: 'Image' },
    { fileName: 'image.jpeg', title: 'Image' },
    { fileName: 'image.png', title: 'Image' },
    { fileName: 'image.mp4', title: 'Image' },
    { fileName: 'image.JPG', title: 'Image' },
    { fileName: 'image', title: 'Image' },

    // Hyphens and underscores both separate words
    { fileName: 'two_words.jpg', title: 'Two Words' },
    { fileName: 'two-words.jpg', title: 'Two Words' },
    { fileName: 'three_whole_words.jpg', title: 'Three Whole Words' },
    { fileName: 'my-photo_1.jpg', title: 'My Photo' },

    // Case is only ever raised, never lowered, so a name that arrives shouting
    // keeps shouting rather than being tidied into Title Case
    { fileName: 'Image.jpg', title: 'Image' },
    { fileName: 'IMAGE.jpg', title: 'IMAGE' },
    { fileName: 'IMG_1234.JPG', title: 'IMG' },

    // Digits are dropped wherever they sit, along with the separator that led
    // to them and any single letter trailing the last of them: the sequence
    // numbers a camera adds are noise in a title, not part of the name
    { fileName: 'image1.jpg', title: 'Image' },
    { fileName: 'image10.jpg', title: 'Image' },
    { fileName: 'image_1.jpg', title: 'Image' },
    { fileName: 'image-1.jpg', title: 'Image' },
    { fileName: 'image 1.jpg', title: 'Image' },
    { fileName: 'image1b.jpg', title: 'Image' },
    { fileName: 'image_1B.jpg', title: 'Image' },
    { fileName: '1love.jpg', title: 'Love' },

    // Names that survive the digit rules with nothing, or almost nothing, left.
    // A dated export is the realistic way to reach the empty title, and the
    // caller has no fallback behind it: the media item is displayed unnamed.
    { fileName: '2024.jpg', title: '' },
    { fileName: '', title: '' },

    // A dot inside the name is not a separator, so it survives into the title.
    // Worth pinning as the behaviour it is, rather than the behaviour anyone
    // would have chosen.
    { fileName: 'photo.2024.jpg', title: 'Photo.' },
];

describe(toTitleFromFilename, () => {
    it.each(CASES)('[$fileName] is titled [$title]', ({ fileName, title }) => {
        expect(toTitleFromFilename(fileName)).toBe(title);
    });
});
