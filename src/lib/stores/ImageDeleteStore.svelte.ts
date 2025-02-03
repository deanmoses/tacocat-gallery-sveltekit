/**
 * Svelte store of image delete state.
 * This store will be empty unless there's an image delete in progress.
 */

import { DeleteState, type DeleteEntry } from '$lib/models/album';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Store of image delete states.
 */
class ImageDeleteStore {
    /**
     * Private writable store.
     */
    #deletes = new SvelteMap<string, DeleteEntry>();

    /**
     * Public read-only version of store
     */
    readonly deletes: ReadonlyMap<string, DeleteEntry> = $derived(this.#deletes);

    add(albumPath: string): void {
        this.#deletes.set(albumPath, {
            status: DeleteState.IN_PROGRESS,
        });
    }

    remove(albumPath: string): void {
        this.#deletes.delete(albumPath);
    }
}
export const imageDeleteStore = new ImageDeleteStore();
