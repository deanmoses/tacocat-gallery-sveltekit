import { writable } from 'svelte/store';

export const album = writable({
    year: "2000",
    title: "Awesome Title"
});