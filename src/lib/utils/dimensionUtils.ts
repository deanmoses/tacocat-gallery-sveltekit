/**
 * Utilities for calculating display dimensions for media items.
 * Scales dimensions so the longer side is at most maxSize (default 1024px).
 */

/**
 * The default maximum size for the longer dimension
 */
const DEFAULT_MAX_SIZE = 1024;

/**
 * Calculate the display width for a media item.
 * Scales so the longer dimension is at most maxSize.
 */
export function getDetailWidth(width: number, height: number, maxSize = DEFAULT_MAX_SIZE): number {
    if (!width || !height) {
        return Math.min(width || maxSize, maxSize);
    }
    // Scale so the longer dimension is at most maxSize
    const maxDim = Math.max(width, height);
    if (maxDim <= maxSize) {
        return width;
    }
    return Math.round(maxSize * (width / maxDim));
}

/**
 * Calculate the display height for a media item.
 * Scales so the longer dimension is at most maxSize.
 */
export function getDetailHeight(width: number, height: number, maxSize = DEFAULT_MAX_SIZE): number {
    if (!width || !height) {
        return Math.min(height || maxSize, maxSize);
    }
    // Scale so the longer dimension is at most maxSize
    const maxDim = Math.max(width, height);
    if (maxDim <= maxSize) {
        return height;
    }
    return Math.round(maxSize * (height / maxDim));
}
