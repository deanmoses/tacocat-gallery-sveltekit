import { RenameState, type RenameEntry } from '$lib/models/album';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Store of image rename states
 */
class ImageRenameStore {
    /**
     * Private writable store
     */
    #renames = new SvelteMap<string, RenameEntry>();

    /**
     * Public read-only version of store
     */
    readonly renames: ReadonlyMap<string, RenameEntry> = $derived(this.#renames);

    addRenameEntry(oldPath: string, newPath: string): void {
        this.#renames.set(oldPath, {
            oldPath,
            newPath,
            status: RenameState.IN_PROGRESS,
        });
    }

    removeRenameEntry(oldPath: string): void {
        this.#renames.delete(oldPath);
    }
}
export const imageRenameStore = new ImageRenameStore();
