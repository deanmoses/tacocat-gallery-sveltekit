/**
 * The oldest browser the site is built for. iOS 15.7 is the last release for the
 * iPhone 6s, 7 and first-generation SE, and one of the gallery's most valued readers
 * is on one of those phones and will stay on it, so this stays put regardless of
 * where Vite's default moves. Desktop Safari 15.6 is the same engine and comes along.
 *
 * What the pin covers and what it cannot is under Browser Support in CLAUDE.md.
 */
export const BROWSER_TARGET: string[] = ['ios15.6', 'safari15.6'];
