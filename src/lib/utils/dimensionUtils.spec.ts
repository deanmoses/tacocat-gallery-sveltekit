import { describe, it, expect } from 'vitest';
import { getDetailWidth, getDetailHeight } from './dimensionUtils';

type DimensionCase = {
    description: string;
    width: number;
    height: number;
    /** Left undefined to exercise the default long side */
    maxSize?: number;
    expectedWidth: number;
    expectedHeight: number;
};

const CASES: DimensionCase[] = [
    // Media that already fits is returned untouched, whichever side is longer
    { description: 'landscape far below the limit', width: 320, height: 240, expectedWidth: 320, expectedHeight: 240 },
    { description: 'landscape just below the limit', width: 800, height: 600, expectedWidth: 800, expectedHeight: 600 },
    { description: 'portrait far below the limit', width: 240, height: 320, expectedWidth: 240, expectedHeight: 320 },
    { description: 'portrait just below the limit', width: 600, height: 800, expectedWidth: 600, expectedHeight: 800 },
    { description: 'square below the limit', width: 500, height: 500, expectedWidth: 500, expectedHeight: 500 },

    // The long side is compared inclusively, so exactly 1024 does not scale
    {
        description: 'long side exactly at the limit',
        width: 1024,
        height: 768,
        expectedWidth: 1024,
        expectedHeight: 768,
    },
    {
        description: 'square exactly at the limit',
        width: 1024,
        height: 1024,
        expectedWidth: 1024,
        expectedHeight: 1024,
    },
    { description: 'one pixel over the limit', width: 1025, height: 1000, expectedWidth: 1024, expectedHeight: 999 },

    // Oversized media scales so the long side lands on the limit
    {
        description: 'landscape at twice the limit',
        width: 2048,
        height: 1536,
        expectedWidth: 1024,
        expectedHeight: 768,
    },
    {
        description: 'landscape far over the limit',
        width: 4000,
        height: 3000,
        expectedWidth: 1024,
        expectedHeight: 768,
    },
    { description: 'portrait at twice the limit', width: 1536, height: 2048, expectedWidth: 768, expectedHeight: 1024 },
    { description: 'portrait far over the limit', width: 3000, height: 4000, expectedWidth: 768, expectedHeight: 1024 },
    { description: 'square over the limit', width: 2048, height: 2048, expectedWidth: 1024, expectedHeight: 1024 },
    {
        description: 'long side at the limit, short side over',
        width: 1024,
        height: 2048,
        expectedWidth: 512,
        expectedHeight: 1024,
    },

    // Ratios whose short side does not divide evenly, so the result is rounded
    // rather than truncated or raised. Every case above scales by a whole
    // number, which left rounding unverified in either direction.
    { description: 'landscape rounding down', width: 3000, height: 1999, expectedWidth: 1024, expectedHeight: 682 },
    { description: 'landscape rounding up', width: 3000, height: 2015, expectedWidth: 1024, expectedHeight: 688 },
    { description: 'portrait rounding down', width: 1999, height: 3000, expectedWidth: 682, expectedHeight: 1024 },
    { description: 'portrait rounding up', width: 2015, height: 3000, expectedWidth: 688, expectedHeight: 1024 },

    // A caller-supplied limit replaces the default on both axes
    { description: 'custom maxSize', width: 2000, height: 1000, maxSize: 500, expectedWidth: 500, expectedHeight: 250 },
    {
        description: 'custom maxSize, already fits',
        width: 400,
        height: 300,
        maxSize: 500,
        expectedWidth: 400,
        expectedHeight: 300,
    },
    {
        description: 'custom maxSize with rounding',
        width: 3000,
        height: 1999,
        maxSize: 500,
        expectedWidth: 500,
        expectedHeight: 333,
    },

    // Media whose dimensions the server never recorded. The known side is used
    // if it fits, and the limit stands in for whatever is missing or too big.
    { description: 'missing width', width: 0, height: 500, expectedWidth: 1024, expectedHeight: 500 },
    { description: 'missing height', width: 500, height: 0, expectedWidth: 500, expectedHeight: 1024 },
    {
        description: 'missing height, oversized width',
        width: 5000,
        height: 0,
        expectedWidth: 1024,
        expectedHeight: 1024,
    },
    {
        description: 'missing width, oversized height',
        width: 0,
        height: 5000,
        expectedWidth: 1024,
        expectedHeight: 1024,
    },
    { description: 'both dimensions missing', width: 0, height: 0, expectedWidth: 1024, expectedHeight: 1024 },
];

describe(getDetailWidth, () => {
    it.each(CASES)('$description $width x $height gives width $expectedWidth', (testCase) => {
        expect(getDetailWidth(testCase.width, testCase.height, testCase.maxSize)).toBe(testCase.expectedWidth);
    });
});

describe(getDetailHeight, () => {
    it.each(CASES)('$description $width x $height gives height $expectedHeight', (testCase) => {
        expect(getDetailHeight(testCase.width, testCase.height, testCase.maxSize)).toBe(testCase.expectedHeight);
    });
});
