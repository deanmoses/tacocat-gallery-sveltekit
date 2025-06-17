/**
 * Date formatting utility functions
 */

/**
 * Formats a date as a short string with month abbreviation and day number.
 *
 * @param d - The date to format
 * @returns A string in the format "Jan 15" (locale-dependent)
 *
 * @example
 * ```typescript
 * const date = new Date('2024-01-15');
 * shortDate(date); // Returns "Jan 15" (or locale equivalent)
 * ```
 */
export function shortDate(d: Date): string {
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Formats a date as a long string with full month name, day, and year.
 *
 * @param d - The date to format
 * @returns A string in the format "January 15, 2024" (locale-dependent)
 *
 * @example
 * ```typescript
 * const date = new Date('2024-01-15');
 * longDate(date); // Returns "January 15, 2024" (or locale equivalent)
 * ```
 */
export function longDate(d: Date): string {
    return d.toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Extracts the year from a Unix timestamp (seconds since epoch).
 *
 * @param seconds - Unix timestamp in seconds (not milliseconds)
 * @returns A string representation of the year (e.g., "2024")
 *
 * @example
 * ```typescript
 * // For timestamp representing January 15, 2024
 * year(1705276800); // Returns "2024"
 * ```
 */
export function year(seconds: number): string {
    const d = new Date(seconds * 1000);
    return '' + d.getFullYear();
}
