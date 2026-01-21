import { describe, test, expect } from 'vitest';
import { getDetailWidth, getDetailHeight } from './dimensionUtils';

describe('getDetailWidth and getDetailHeight', () => {
    describe('small landscape media (width > height, both < 1024)', () => {
        // e.g., 320x240 video - should stay unchanged
        test('320x240 returns unchanged dimensions', () => {
            expect(getDetailWidth(320, 240)).toBe(320);
            expect(getDetailHeight(320, 240)).toBe(240);
        });

        test('800x600 returns unchanged dimensions', () => {
            expect(getDetailWidth(800, 600)).toBe(800);
            expect(getDetailHeight(800, 600)).toBe(600);
        });
    });

    describe('small portrait media (height > width, both < 1024)', () => {
        test('240x320 returns unchanged dimensions', () => {
            expect(getDetailWidth(240, 320)).toBe(240);
            expect(getDetailHeight(240, 320)).toBe(320);
        });

        test('600x800 returns unchanged dimensions', () => {
            expect(getDetailWidth(600, 800)).toBe(600);
            expect(getDetailHeight(600, 800)).toBe(800);
        });
    });

    describe('large landscape media (width > height, width > 1024)', () => {
        // e.g., 2048x1536 image - should scale down to 1024x768
        test('2048x1536 scales to 1024x768', () => {
            expect(getDetailWidth(2048, 1536)).toBe(1024);
            expect(getDetailHeight(2048, 1536)).toBe(768);
        });

        test('4000x3000 scales to 1024x768', () => {
            expect(getDetailWidth(4000, 3000)).toBe(1024);
            expect(getDetailHeight(4000, 3000)).toBe(768);
        });
    });

    describe('large portrait media (height > width, height > 1024)', () => {
        // e.g., 1536x2048 image - should scale down to 768x1024
        test('1536x2048 scales to 768x1024', () => {
            expect(getDetailWidth(1536, 2048)).toBe(768);
            expect(getDetailHeight(1536, 2048)).toBe(1024);
        });

        test('3000x4000 scales to 768x1024', () => {
            expect(getDetailWidth(3000, 4000)).toBe(768);
            expect(getDetailHeight(3000, 4000)).toBe(1024);
        });
    });

    describe('square media', () => {
        test('small square 500x500 returns unchanged', () => {
            expect(getDetailWidth(500, 500)).toBe(500);
            expect(getDetailHeight(500, 500)).toBe(500);
        });

        test('exact 1024x1024 returns unchanged', () => {
            expect(getDetailWidth(1024, 1024)).toBe(1024);
            expect(getDetailHeight(1024, 1024)).toBe(1024);
        });

        test('large square 2048x2048 scales to 1024x1024', () => {
            expect(getDetailWidth(2048, 2048)).toBe(1024);
            expect(getDetailHeight(2048, 2048)).toBe(1024);
        });
    });

    describe('edge cases', () => {
        test('exactly 1024 on long side stays unchanged', () => {
            expect(getDetailWidth(1024, 768)).toBe(1024);
            expect(getDetailHeight(1024, 768)).toBe(768);
        });

        test('exactly 1024 on short side with larger height scales', () => {
            expect(getDetailWidth(1024, 2048)).toBe(512);
            expect(getDetailHeight(1024, 2048)).toBe(1024);
        });

        test('missing width returns maxSize for width', () => {
            expect(getDetailWidth(0, 500)).toBe(1024);
        });

        test('missing height returns maxSize for height', () => {
            expect(getDetailHeight(500, 0)).toBe(1024);
        });

        test('huge width with missing height is clamped to maxSize', () => {
            expect(getDetailWidth(5000, 0)).toBe(1024);
        });

        test('huge height with missing width is clamped to maxSize', () => {
            expect(getDetailHeight(0, 5000)).toBe(1024);
        });
    });

    describe('custom maxSize', () => {
        test('scales to custom maxSize', () => {
            expect(getDetailWidth(2000, 1000, 500)).toBe(500);
            expect(getDetailHeight(2000, 1000, 500)).toBe(250);
        });
    });
});
