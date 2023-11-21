/**
 * Svelte store of the year from the path
 */

import { derived, type Readable } from 'svelte/store';
import { page } from '$app/stores';

/**
 * Return year from the path or empty string if not in path
 */
export function getYear(): Readable<string> {
    return derived(page, ($page) => {
        return $page.params.year || '';
    });
}
