import { DeleteState, type DeleteEntry } from '$lib/models/album';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Store of album delete states.
 */
class AlbumDeleteStore {
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
export const albumDeleteStore = new AlbumDeleteStore();
