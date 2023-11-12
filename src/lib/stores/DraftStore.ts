/**
 * A Svelte store representing the draft changes to an album or a image
 */

import { writable, type Writable, derived, type Readable, get } from 'svelte/store';
import type { Draft, DraftContent } from '$lib/models/draft';
import { DraftStatus } from '$lib/models/draft';
import { produce } from 'immer';
import { getAlbumType, isAlbumPath, isImagePath } from '$lib/utils/path-utils';
import Config from '$lib/utils/config';
import { AlbumType, type Image } from '$lib/models/album';
import { type AlbumEntry, albumStore } from './AlbumStore';
import { dev } from '$app/environment';
import { updateAlbumServerCache } from './AlbumServerCache';
import { getParentFromPath, isValidPath } from '$lib/utils/galleryPathUtils';

const initialState: Draft = {
    status: DraftStatus.NO_CHANGES,
    path: '/1800', // TODO FIX THIS
    content: {},
};

/**
 * Manages the store of the draft changes to an album or a image
 *
 * Unlike the Redux version, which holds a draft per album, this
 * only holds the one single draft that's currently being edited.
 * The Redux version was over-engineered; I'm not getting into
 * offline editing and bulk saving drafts when the user goes back online.
 */
class DraftStore {
    /**
     * A private writable Svelte store holding the draft
     */
    private _draft: Writable<Draft> = writable(initialState);

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
        this._draft.set(state);
    }

    /**
     * @returns the status of the draft
     */
    getStatus(): Readable<DraftStatus> {
        return derived(this._draft, ($draft) => {
            return $draft.status;
        });
    }

    /**
     * @returns whether there are unsaved changes that should block navigation away from the page
     */
    getOkToNavigate(): Readable<boolean> {
        return derived(this._draft, ($draft) => {
            const status = $draft.status;
            return status !== DraftStatus.UNSAVED_CHANGES && status != DraftStatus.SAVING;
        });
    }

    /**
     * Set the title of the current draft
     */
    setTitle(title: string): void {
        this.updateContent((content) => (content.title = title));
    }

    /**
     * Set the description of the current draft
     */
    setDescription(description: string): void {
        this.updateContent((content) => (content.description = description));
    }

    /**
     * Set the album summary of the current draft
     */
    setCustomData(customdata: string): void {
        this.updateContent((content) => (content.customdata = customdata));
    }

    /**
     * Set the published status of the current draft
     */
    setPublished(published: boolean): void {
        this.updateContent((content) => (content.unpublished = !published));
    }

    /**
     * Throw away all draft edits; reset the store
     */
    cancel(): void {
        console.log('canceling draft: ', get(this._draft));
        this._draft.set(initialState);
    }

    /**
     * Save the current draft to the server
     */
    save(): void {
        if (dev) this.saveFake();
        else this.saveReal();
    }

    /**
     * Simulates a successful save, for localhost testing
     */
    private saveFake(): void {
        this.setStatus(DraftStatus.SAVING);

        const draft: Draft = get(this._draft);

        console.warn('FAKE: saving the draft: ', draft);

        // Simulate a save
        setTimeout(() => {
            console.warn('FAKE: saved the draft');

            this.updateClientStateAfterSave(draft);

            this.setStatus(DraftStatus.SAVED);

            // Clear the saved status after a while
            setTimeout(() => {
                // Only clear saved status if the status is actually still saved
                if (get(this._draft).status == DraftStatus.SAVED) {
                    this.setStatus(DraftStatus.NO_CHANGES);
                }
            }, 4000);
        }, 1000);
    }

    /**
     * Save the current draft to the server
     */
    private saveReal(): void {
        const draft: Draft = get(this._draft);

        // Do I actually have anything to save?
        // This should never happen
        if (!draft || !draft.path || !draft.content) {
            console.error('Error saving draft: nothing to save!');
            this.setStatus(DraftStatus.ERRORED);
        }
        // Else I have something to save
        else {
            console.log('Saving the draft: ', draft);
            this.setStatus(DraftStatus.SAVING);

            // Send the save request
            const saveUrl = Config.saveUrl(draft.path);
            const requestConfig = this.getSaveRequestConfig(draft);
            fetch(saveUrl, requestConfig)
                .then((response) => this.checkForErrors(response))
                .then((response) => response.json())
                .then((json) => this.checkJsonForErrors(json, draft))
                .then(() => this.updateClientStateAfterSave(draft))
                .catch((error) => this.handleSaveError(error));
        }
    }

    /**
     * @returns the configuration for the save request
     */
    private getSaveRequestConfig(draft: Draft): RequestInit {
        // The body of the form I will be sending to the server
        const formData = new FormData();
        formData.append('eip_context', isImagePath(draft.path) ? 'image' : 'album');

        // Add the content of the draft (the actual album or image fields) to the form body
        const content = draft.content;
        for (const fieldName in content) {
            formData.append(fieldName, content[fieldName]);
        }

        // The save request configuration
        const requestConfig: RequestInit = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
            body: formData,
            // no-store: bypass the HTTP cache completely.
            // This will make the browser not look into the HTTP cache
            // on the way to the network, and never store the resulting
            // response in the HTTP cache.
            // Fetch() will behave as if no HTTP cache exists.
            cache: 'no-store',
            credentials: 'include',
        };

        return requestConfig;
    }

    /**
     * Check for errors in the draft save response
     *
     * @throws error if there was anything but a success returned
     */
    private checkForErrors(response: Response): Response {
        if (!response.ok) {
            throw Error(`Response not OK: ${response.statusText}`);
        }
        if (response.status !== 200) {
            throw Error(`Expected response to be 200.  Instead got ${response.status}: ${response.statusText}`);
        } else if (!response.headers.get('content-type').startsWith('application/json')) {
            throw Error(
                `Expected response to be in JSON.  Instead got ${response.headers.get('content-type')}. ${
                    response.statusText
                }`,
            );
        }
        return response;
    }

    /**
     * Check that the JSON coming back from the save response indicates success
     * @throws error if there was anything but a success returned
     */
    private checkJsonForErrors(json: any, draft: Draft): void {
        if (!json || !json.success) {
            const msg = `Server did not respond with success saving draft for ${draft.path}.  Instead, responded with:`;
            console.error(msg, json, 'Draft:', draft);
            throw new Error(msg + json);
        } else {
            console.log(`Draft [${draft.path}] save success.  JSON: `, json);
        }
    }

    /**
     * Draft was successfully saved on the server.  Update the client state.
     * Updates both the album in memory and on the browser's local filesystem.
     */
    private updateClientStateAfterSave(draft: Draft): void {
        let path = draft.path;
        path = path.replace(/^\//, ''); // strip initial /

        // If it was an image that was saved...
        if (isImagePath(path)) {
            // Get the album in which the image resides
            const albumPath = getParentFromPath(path);
            console.log(`Image save: parent album: [${albumPath}]`);
            const albumEntry: AlbumEntry = albumStore.getFromInMemory(albumPath);

            if (!albumEntry) throw new Error(`Did not find album entry [${albumPath}] in memory`);
            if (!albumEntry.album)
                throw new Error(`Did not find album [${albumPath}] in memory: entry exists but it has no album`);

            // Make a copy of the album entry.  Apply changes to the copy
            const updatedAlbumEntry = produce(albumEntry, (albumEntryCopy) => {
                // Get the image
                const image: Image = albumEntryCopy.album.images.find((image: Image) => image.path === path);

                if (!image) throw new Error(`Did not find image [${path}] in album [${albumPath}]`);

                // Apply contents of draft to image
                Object.assign(image, draft.content);
            });

            // Update album in store
            // This also writes the album to the browser's local disk cache;
            // otherwise, the next page load the value will be wrong
            albumStore.updateAlbumEntry(updatedAlbumEntry);
        }
        // Else it was an album that was saved...
        else {
            const albumEntry: AlbumEntry = albumStore.getFromInMemory(path);

            if (!albumEntry) throw new Error(`Did not find album entry [${path}] in memory`);
            if (!albumEntry.album)
                throw new Error(`Did not find album [${path}] in memory: entry exists but it has no album`);

            // Make a copy of the album entry.  Apply changes to the copy
            const updatedAlbumEntry = produce(albumEntry, (albumEntryCopy) => {
                // Apply contents of draft to the album
                Object.assign(albumEntryCopy.album, draft.content);
            });

            // Update album in store
            // This also writes the album to the browser's local disk cache;
            // otherwise, the next page load the value will be wrong
            albumStore.updateAlbumEntry(updatedAlbumEntry);
        }

        this.setStatus(DraftStatus.SAVED);

        // For some types of albums, update the server's cache of the album
        if (isAlbumPath(path)) {
            console.log(`isAlbumPath(${path}): ${isAlbumPath(path)}`);
            const albumType = getAlbumType(path);
            console.log(`albumType: [${albumType}]`);
            // If it's a year album, update its cache
            if (albumType === AlbumType.YEAR) {
                updateAlbumServerCache(path);
            }
            // If it's a day album, update parent year album
            else if (albumType === AlbumType.DAY) {
                updateAlbumServerCache(getParentFromPath(path));
            }
        } else {
            console.log(`just updated a photo not an album, so not updating server cache`);
        }

        console.log('DraftStore: before save clear timeout');

        // Clear the saved status after a while
        setTimeout(() => {
            console.log('DraftStore: save clear timed out');
            // Only clear saved status if the status is actually still saved
            if (get(this._draft).status == DraftStatus.SAVED) {
                console.log('DraftStore: in timeout, setting draft status to NO_CHANGES');
                this.setStatus(DraftStatus.NO_CHANGES);
            } else {
                console.log('Draft status was not still SAVED');
            }
        }, 4000);
    }

    /**
     * There was an error saving the draft
     */
    private handleSaveError(e) {
        console.error('Error saving draft: ', e);
        this.setStatus(DraftStatus.ERRORED);
    }

    /**
     * Change the status of the draft
     */
    private setStatus(newStatus: DraftStatus): void {
        const state = produce(get(this._draft), (newState) => {
            newState.status = newStatus;
        });
        this._draft.set(state);
    }

    /**
     * Update the content of the draft
     */
    private updateContent(applyChangesToDraftContent: (draftContent: DraftContent) => void): void {
        const newState: Draft = produce(get(this._draft), (originalState) => {
            originalState.status = DraftStatus.UNSAVED_CHANGES;
            applyChangesToDraftContent(originalState.content);
        });
        console.log('Update draft: ', newState.content);
        this._draft.set(newState);
    }
}

export default new DraftStore();
