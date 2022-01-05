/**
 * A Svelte store representing whether the site is in edit mode
 */
import { writable, type Writable } from 'svelte/store';

export const editMode: Writable<boolean> = writable(false);