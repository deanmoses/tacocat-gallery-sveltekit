import { RenameState, type RenameEntry } from '$lib/models/album';
import { SvelteMap } from 'svelte/reactivity';

/**
 * Store of album rename states
 */
class AlbumRenameStore {
    /**
     * Private writable store
     */
    #renames = new SvelteMap<string, RenameEntry>();

    /**
     * Public read-only version of store
     */
    readonly renames: ReadonlyMap<string, RenameEntry> = $derived(this.#renames);

    add(oldPath: string, newPath: string): void {
        this.#renames.set(oldPath, {
            oldPath: oldPath,
            newPath: newPath,
            status: RenameState.IN_PROGRESS,
        });
    }

    remove(albumPath: string): void {
        this.#renames.delete(albumPath);
    }
}
export const albumRenameStore = new AlbumRenameStore();
