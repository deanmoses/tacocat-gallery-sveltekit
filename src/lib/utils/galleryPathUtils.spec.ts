import { test, expect, describe } from 'vitest';
import { sanitizeImageName } from './galleryPathUtils';

describe('sanitizeImageName', () => {
    // Basic transformations
    test('converts to lowercase', () => {
        expect(sanitizeImageName('IMAGE.JPG')).toBe('image.jpg');
        expect(sanitizeImageName('Photo.PNG')).toBe('photo.png');
    });

    test('converts .jpeg to .jpg', () => {
        expect(sanitizeImageName('photo.jpeg')).toBe('photo.jpg');
        expect(sanitizeImageName('PHOTO.JPEG')).toBe('photo.jpg');
    });

    // Invalid character handling
    test('converts spaces to underscores', () => {
        expect(sanitizeImageName('my photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeImageName('my  photo.jpg')).toBe('my_photo.jpg');
    });

    test('converts hyphens to underscores', () => {
        expect(sanitizeImageName('my-photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeImageName('my--photo.jpg')).toBe('my_photo.jpg');
    });

    test('converts special characters to underscores', () => {
        expect(sanitizeImageName('photo@home.jpg')).toBe('photo_home.jpg');
        expect(sanitizeImageName('photo#1.jpg')).toBe('photo_1.jpg');
        expect(sanitizeImageName('photo (1).jpg')).toBe('photo_1.jpg');
        expect(sanitizeImageName("photo's.jpg")).toBe('photo_s.jpg');
    });

    // Multiple underscore handling
    test('collapses multiple underscores to single', () => {
        expect(sanitizeImageName('my___photo.jpg')).toBe('my_photo.jpg');
        expect(sanitizeImageName('my - photo.jpg')).toBe('my_photo.jpg');
    });

    // Leading/trailing underscore handling
    test('removes leading underscores', () => {
        expect(sanitizeImageName('_photo.jpg')).toBe('photo.jpg');
        expect(sanitizeImageName('__photo.jpg')).toBe('photo.jpg');
        expect(sanitizeImageName('-photo.jpg')).toBe('photo.jpg');
    });

    test('removes trailing underscores before extension', () => {
        expect(sanitizeImageName('photo_.jpg')).toBe('photo.jpg');
        expect(sanitizeImageName('photo__.jpg')).toBe('photo.jpg');
        expect(sanitizeImageName('photo-.jpg')).toBe('photo.jpg');
    });

    // Edge cases
    test('handles empty string', () => {
        expect(sanitizeImageName('')).toBe('');
    });

    test('handles already valid names', () => {
        expect(sanitizeImageName('photo.jpg')).toBe('photo.jpg');
        expect(sanitizeImageName('my_photo_1.jpg')).toBe('my_photo_1.jpg');
    });

    test('preserves numbers', () => {
        expect(sanitizeImageName('photo123.jpg')).toBe('photo123.jpg');
        expect(sanitizeImageName('123photo.jpg')).toBe('123photo.jpg');
        expect(sanitizeImageName('photo_1_2_3.jpg')).toBe('photo_1_2_3.jpg');
    });

    test('handles various extensions', () => {
        expect(sanitizeImageName('photo.png')).toBe('photo.png');
        expect(sanitizeImageName('photo.gif')).toBe('photo.gif');
        expect(sanitizeImageName('photo.PNG')).toBe('photo.png');
        expect(sanitizeImageName('photo.GIF')).toBe('photo.gif');
    });

    // Real-world examples from uploads
    test('handles typical camera/phone filenames', () => {
        expect(sanitizeImageName('IMG_1234.JPG')).toBe('img_1234.jpg');
        expect(sanitizeImageName('DSC_0001.jpeg')).toBe('dsc_0001.jpg');
        expect(sanitizeImageName('Photo 2024-01-15.jpg')).toBe('photo_2024_01_15.jpg');
        expect(sanitizeImageName('Screenshot 2024-01-15 at 10.30.45 AM.png')).toBe(
            'screenshot_2024_01_15_at_10.30.45_am.png',
        );
    });
});
