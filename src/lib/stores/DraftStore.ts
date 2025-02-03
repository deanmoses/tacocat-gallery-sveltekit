import { writable, type Writable, derived, type Readable, get } from 'svelte/store';
import type { Draft, DraftContent } from '$lib/models/draft';
import { DraftStatus } from '$lib/models/draft';
import { produce } from 'immer';
import { albumStore } from './AlbumStore';
import { getParentFromPath, isValidImagePath, isValidPath } from '$lib/utils/galleryPathUtils';
import type { Thumbable } from '$lib/models/GalleryItemInterfaces';
import { updateUrl } from '$lib/utils/config';
import type { AlbumEntry } from '$lib/models/album';
import { toast } from '@zerodevx/svelte-toast';

const initialState: Draft = {
    status: DraftStatus.NO_CHANGES,
    path: '/1800', // TODO FIX THIS
    content: {},
};

/**
 * Store of the draft changes to an album or a image
 *
 * Unlike the Redux version, which holds a draft per album, this
 * only holds the one single draft that's currently being edited.
 * The Redux version was over-engineered; I'm not getting into
 * offline editing and bulk saving drafts when the user goes back online.
 */
class DraftStore {
    /**
     * A writable Svelte store holding the draft
     */
    #draft: Writable<Draft> = writable(initialState);

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
        this.#draft.set(state);
    }

    /**
     * @returns the status of the draft
     */
    getStatus(): Readable<DraftStatus | undefined> {
        return derived(this.#draft, ($draft) => {
            return $draft.status;
        });
    }

    /**
     * @returns whether there are unsaved changes that should block navigation away from the page
     */
    getOkToNavigate(): Readable<boolean> {
        return derived(this.#draft, ($draft) => {
            const status = $draft.status;
            return status !== DraftStatus.UNSAVED_CHANGES && status != DraftStatus.SAVING;
        });
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
        console.log('canceling draft: ', get(this.#draft));
        this.#draft.set(initialState);
    }

    /**
     * Save the current draft to the server
     */
    async save(): Promise<void> {
        const draft: Draft = get(this.#draft);
        if (!draft || !draft.path || !draft.content) {
            console.error(`Error saving [${draft.path}]: nothing to save!`);
            this.#setStatus(DraftStatus.ERRORED);
        } else {
            console.log(`Saving draft [${draft.path}]: `, draft.content);
            this.#setStatus(DraftStatus.SAVING);
            try {
                const response = await fetch(updateUrl(draft.path), {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store',
                    body: JSON.stringify(draft.content),
                });
                const json = await response.json();
                if (!response.ok) throw Error(json?.errorMessage || response.statusText);
                this.#updateClientStateAfterSave(draft);
            } catch (e) {
                console.error(`Error saving [${draft.path}]: ${e}`);
                toast.push(e instanceof Error ? e.message : 'Error saving');
                this.#setStatus(DraftStatus.ERRORED);
            }
        }
    }

    /**
     * Draft was successfully saved on the server.  Update the client state.
     * Updates both the album in memory and on the browser's local filesystem.
     */
    #updateClientStateAfterSave(draft: Draft): void {
        const path = draft.path;

        // If it was an image that was saved...
        if (isValidImagePath(path)) {
            // Get the album in which the image resides
            const albumPath = getParentFromPath(path);
            console.log(`Image save: parent album: [${albumPath}]`);
            const albumEntry: AlbumEntry | null = albumStore.getFromInMemory(albumPath);
            if (!albumEntry) throw new Error(`Did not find album entry [${albumPath}] in memory`);
            if (!albumEntry.album)
                throw new Error(`Did not find album [${albumPath}] in memory: entry exists but it has no album`);

            // Make a copy of the album entry.  Apply changes to the copy
            const updatedAlbumEntry = produce(albumEntry, (albumEntryCopy) => {
                if (albumEntryCopy === undefined) throw new Error('albumEntryCopy is undefined');
                const image: Thumbable | undefined = albumEntryCopy.album?.images.find(
                    (image: Thumbable) => image.path === path,
                );
                if (!image) throw new Error(`Did not find image [${path}] in album [${albumPath}]`);
                Object.assign(image, draft.content); // Apply contents of draft to image
            });

            // Update album in store
            // This also writes the album to the browser's local disk cache;
            // otherwise, the next page load the value will be wrong
            albumStore.updateAlbumEntry(updatedAlbumEntry);
        }
        // Else it was an album that was saved...
        else {
            const albumEntry: AlbumEntry | null = albumStore.getFromInMemory(path);
            if (!albumEntry) throw new Error(`Did not find album entry [${path}] in memory`);
            if (!albumEntry.album)
                throw new Error(`Did not find album [${path}] in memory: entry exists but it has no album`);

            // Make a copy of the album entry.  Apply changes to the copy
            const updatedAlbumEntry = produce(albumEntry, (albumEntryCopy) => {
                if (!albumEntryCopy.album) throw new Error(`No album on albumEntry`);
                Object.assign(albumEntryCopy.album, draft.content); // Apply contents of draft to the album
            });

            // Update album in store
            // This also writes the album to the browser's local disk cache;
            // otherwise, the next page load the value will be wrong
            albumStore.updateAlbumEntry(updatedAlbumEntry);
        }

        this.#setStatus(DraftStatus.SAVED);

        console.log('DraftStore: before save clear timeout');

        // Clear the saved status after a while
        setTimeout(() => {
            console.log('DraftStore: save clear timed out');
            // Only clear saved status if the status is actually still saved
            if (get(this.#draft).status == DraftStatus.SAVED) {
                console.log('DraftStore: in timeout, setting draft status to NO_CHANGES');
                this.#setStatus(DraftStatus.NO_CHANGES);
            } else {
                console.log('Draft status was not still SAVED');
            }
        }, 4000);
    }

    /**
     * Change the status of the draft
     */
    #setStatus(newStatus: DraftStatus): void {
        const state = produce(get(this.#draft), (newState) => {
            newState.status = newStatus;
        });
        this.#draft.set(state);
    }

    /**
     * Update the content of the draft
     */
    #updateContent(applyChangesToDraftContent: (draftContent: DraftContent) => void): void {
        const newState: Draft = produce(get(this.#draft), (originalState) => {
            originalState.status = DraftStatus.UNSAVED_CHANGES;
            if (originalState.content === undefined) throw 'originalState.content is undefined';
            applyChangesToDraftContent(originalState.content);
        });
        console.log(`Update draft [${newState.path}]: `, newState.content);
        this.#draft.set(newState);
    }
}

export default new DraftStore();
