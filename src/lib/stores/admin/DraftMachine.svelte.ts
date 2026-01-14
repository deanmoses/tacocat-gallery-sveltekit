import type { Draft, DraftContent } from '$lib/models/draft';
import { DraftStatus } from '$lib/models/draft';
import { produce } from 'immer';
import { albumLoadMachine } from '../AlbumLoadMachine.svelte';
import { getParentFromPath, isValidImagePath, isValidPath } from '$lib/utils/galleryPathUtils';
import type { Thumbable } from '$lib/models/GalleryItemInterfaces';
import { updateUrl } from '$lib/utils/config';
import { adminApi } from '$lib/utils/adminApi';
import { toast } from '@zerodevx/svelte-toast';
import { albumState } from '../AlbumState.svelte';

const initialState: Draft = {
    status: DraftStatus.NO_CHANGES,
    path: '/1800', // TODO FIX THIS
    content: {},
};

/**
 * Store of the draft changes to an album or a image
 *
 * Unlike the Redux version, which held a draft per album, this
 * only holds the one single draft that's currently being edited.
 * The Redux version was over-engineered; I'm not getting into
 * offline editing and bulk saving drafts when the user goes back online.
 */
class DraftMachine {
    /**
     * Private writable store holding the draft
     */
    #draft: Draft = $state(initialState);

    /**
     * Public read-only store of the draft
     */
    readonly draft: Draft = $derived(this.#draft);

    /**
     * Public read-only copy of draft status
     */
    readonly status: DraftStatus | undefined = $derived(this.#draft.status);

    readonly okToNavigate: boolean = $derived(
        this.#draft.status !== DraftStatus.UNSAVED_CHANGES && this.#draft.status != DraftStatus.SAVING,
    );

    //
    // STATE TRANSITION METHODS
    // These mutate the store's state.
    //
    // Characteristics:
    //  - These are the ONLY way to update this store's state.
    //    These should be the only public methods on this store.
    //  - These ONLY update state.
    //    If they have to do any work, like making a server call, they invoke it in an
    //    event-like fire-and-forget fashion, meaning invoke async methods *without* await.
    //  - These are synchronous.
    //    They expectation is that they return near-instantly.
    //  - These return void.
    //    To read this store's state, use one of the public $derived() fields
    //

    /**
     * Initialize or reset the draft state with the given path
     * @param path the URL path, TODO make this an image / album path
     */
    init(path: string): void {
        console.log(`Init draft [${path}]`);
        if (!isValidPath(path)) throw new Error(`Invalid path [${path}]`);
        const state = produce(initialState, (newState) => {
            newState.path = path;
        });
        this.#draft = state;
    }

    /**
     * Set the title of the current draft
     */
    setTitle(title: string): void {
        this.#updateContent((content) => (content.title = title));
    }

    /**
     * Set the description of the current draft
     */
    setDescription(description: string): void {
        this.#updateContent((content) => (content.description = description));
    }

    /**
     * Set the album summary of the current draft
     */
    setSummary(summary: string): void {
        this.#updateContent((content) => (content.summary = summary));
    }

    /**
     * Set the published status of the current draft
     */
    setPublished(published: boolean): void {
        this.#updateContent((content) => (content.published = published));
    }

    /**
     * Throw away all draft edits; reset the store
     */
    cancel(): void {
        console.log('canceling draft: ', $state.snapshot(this.#draft));
        this.#draft = initialState;
    }

    /**
     * Save the current draft to the server
     */
    save(): void {
        this.#save(this.#draft); // call async logic in a fire-and-forget manner
    }

    #saveStart(): void {
        this.#setStatus(DraftStatus.SAVING);
    }

    #saveError(errorMessage?: string): void {
        this.#setStatus(DraftStatus.ERRORED);
        if (errorMessage) toast.push(errorMessage);
    }

    #saveSuccess(): void {
        this.#setStatus(DraftStatus.SAVED);
    }

    #clearSaveSuccess(): void {
        // Only clear saved status if the status is actually still saved
        if (this.#draft.status == DraftStatus.SAVED) {
            console.log('DraftStore: in timeout, setting draft status to NO_CHANGES');
            this.#setStatus(DraftStatus.NO_CHANGES);
        } else {
            console.log('Draft status was not still SAVED');
        }
    }

    /**
     * Change the status of the draft
     */
    #setStatus(newStatus: DraftStatus): void {
        const state = produce(this.#draft, (newState) => {
            newState.status = newStatus;
        });
        this.#draft = state;
    }

    /**
     * Update the content of the draft
     */
    #updateContent(applyChangesToDraftContent: (draftContent: DraftContent) => void): void {
        const newState: Draft = produce(this.#draft, (originalState) => {
            originalState.status = DraftStatus.UNSAVED_CHANGES;
            if (originalState.content === undefined) throw 'originalState.content is undefined';
            applyChangesToDraftContent(originalState.content);
        });
        console.log(`Update draft [${newState.path}]: `, newState.content);
        this.#draft = newState;
    }

    //
    // SERVICE METHODS
    // These 'do work', like making a server call.
    //
    // Characteristics:
    //  - These are private, meant to only be called by STATE TRANSITION METHODS
    //  - These don't mutate state directly; rather, they call STATE TRANSITION METHODS to do it
    //  - These are generally async
    //  - These don't return values; they return void or Promise<void>
    //

    async #save(draft: Draft): Promise<void> {
        if (!draft || !draft.path || !draft.content) {
            console.error(`Error saving [${draft.path}]: nothing to save!`);
            this.#saveError();
        } else {
            console.log(`Saving draft [${draft.path}]: `, draft.content);
            this.#saveStart();
            try {
                const response = await adminApi.patch(updateUrl(draft.path), draft.content);
                if (!response.ok) {
                    const json = await response.json().catch(() => ({}));
                    throw new Error(json?.errorMessage || response.statusText);
                }
            } catch (e) {
                console.error(`Error saving [${draft.path}]: ${e}`);
                this.#saveError(e instanceof Error ? e.message : 'Error saving');
                return;
            }

            // UPDATE CLIENT STATE
            // Update both the album in memory and on the browser's local filesystem

            // If it was an image that was saved...
            if (isValidImagePath(draft.path)) {
                // Get the album in which the image resides
                const albumPath = getParentFromPath(draft.path);
                console.log(`Image save: parent album: [${albumPath}]`);
                const albumEntry = albumState.albums.get(albumPath);
                if (!albumEntry) throw new Error(`Did not find album entry [${albumPath}] in memory`);
                if (!albumEntry.album)
                    throw new Error(`Did not find album [${albumPath}] in memory: entry exists but it has no album`);

                // Make a copy of the album entry.  Apply changes to the copy
                const updatedAlbumEntry = produce(albumEntry, (albumEntryCopy) => {
                    if (albumEntryCopy === undefined) throw new Error('albumEntryCopy is undefined');
                    const image: Thumbable | undefined = albumEntryCopy.album?.images.find(
                        (image: Thumbable) => image.path === draft.path,
                    );
                    if (!image) throw new Error(`Did not find image [${draft.path}] in album [${albumPath}]`);
                    Object.assign(image, draft.content); // Apply contents of draft to image
                });

                // Update album in store
                // This also writes the album to the browser's local disk cache;
                // otherwise, the next page load the value will be wrong
                albumLoadMachine.updateAlbumEntry(updatedAlbumEntry);
            }
            // Else it was an album that was saved...
            else {
                const albumEntry = albumState.albums.get(draft.path);
                if (!albumEntry) throw new Error(`Did not find album entry [${draft.path}] in memory`);
                if (!albumEntry.album)
                    throw new Error(`Did not find album [${draft.path}] in memory: entry exists but it has no album`);

                // Make a copy of the album entry.  Apply changes to the copy
                const updatedAlbumEntry = produce(albumEntry, (albumEntryCopy) => {
                    if (!albumEntryCopy.album) throw new Error(`No album on albumEntry`);
                    Object.assign(albumEntryCopy.album, draft.content); // Apply contents of draft to the album
                });

                // Update album in store
                // This also writes the album to the browser's local disk cache;
                // otherwise, the next page load the value will be wrong
                albumLoadMachine.updateAlbumEntry(updatedAlbumEntry);
            }

            this.#saveSuccess();

            // Clear the saved status after a while
            console.log('DraftStore: before save clear timeout');
            setTimeout(() => {
                console.log('DraftStore: save clear timed out');
                this.#clearSaveSuccess();
            }, 4000);
        }
    }
}
export const draftMachine = new DraftMachine();
