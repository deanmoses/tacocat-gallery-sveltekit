/**
 * A Svelte store representing the draft changes to an album or a image
 */

import { writable, type Writable, derived, type Readable, get} from 'svelte/store';
import type { Draft, DraftContent } from '$lib/models/draft';
import { DraftStatus }  from '$lib/models/draft';
import produce from "immer";
import { getAlbumType, getParentFromPath, isAlbumPath, isImagePath } from '$lib/utils/path-utils';
import Config from '$lib/utils/config';
import { Album, AlbumType, type Image } from '$lib/models/album';
import { albumStore } from './AlbumStore';

const initialState: Draft = {
	status: DraftStatus.NO_CHANGES,
	path: "/1800", // TODO FIX THIS
	content: {}
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
		console.log("Init draft: ", path);
		const state = produce(initialState, newState => { 
			newState.path = path;
		})
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
			return status !== DraftStatus.UNSAVED_CHANGES && status != DraftStatus.SAVING
		});
	}

	/**
	 * Set the title of the current draft
	 */
	 setTitle(title: string): void {
		 this.updateContent(content => (content.title = title));
	}

	/**
	 * Set the desc of the current draft
	 */
	setDesc(desc: string): void {
		this.updateContent(content => (content.desc = desc));
	}

	setPublished(published: boolean): void {
		this.updateContent(content => (content.published = published));
	}

	/**
	 * Throw away all draft edits; reset the store
	 */
	cancel(): void {
		console.log("canceling draft: ", get(this._draft));
		this._draft.set(initialState);
	}

	/**
	 * Save the current draft to the server
	 */
	save(): void {
		const draft: Draft = get(this._draft);

		console.log("Saving the draft: ", draft);

		// Sanity check: do I actually have anything to save?
		// This should never happen
		if (!draft || !draft.path || !draft.content) {
			console.log("Error saving draft: nothing to save!");
			this.setStatus(DraftStatus.ERRORED);
		}
		else {
			// Allow the UI to tell the user that a save is happening
			this.setStatus(DraftStatus.SAVING);

			// Save
			const saveUrl = Config.saveUrl(draft.path);
			const requestConfig = this.getSaveRequestConfig(draft);
			fetch(saveUrl, requestConfig)
				.then(response => this.checkForSaveErrors(response))
				.then(response => response.json())
				.then(json => this.handleSaveJsonResponse(draft, json))
				.catch(error => this.handleSaveError(error));
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
				Accept: 'application/json'
			},
			body: formData,
			cache: 'no-store',
			credentials: 'include'
		};

		return requestConfig;
	}

	/**
	 * Check for errors in the draft save response
	 * 
	 * @throws error if there was anything but a success returned 
	 */
	private checkForSaveErrors(response: Response): Response {
		if (!response.ok) {
			throw Error(`Response not OK: ${response.statusText}`);
		}
		if (response.status !== 200) {
			throw Error(`Expected response to be 200.  Instead got ${response.status}: ${response.statusText}`);
		}
		else if (!response.headers.get("content-type").startsWith('application/json')) {
			throw Error(`Expected response to be in JSON.  Instead got ${response.headers.get("content-type")}. ${response.statusText}`);
		}
		return response;
	}

	/**
	 * Draft save responded with what I expected, a JSON response
	 */
	private handleSaveJsonResponse(draft: Draft, json: any): void {
		const path = draft.path;
		console.log(`Draft [${path}] save success.  JSON: `, json);

		if (!json || !json.success) {
			const msg = `Server did not respond with success saving draft for ${path}.  Instead, responded with:`;
			console.log(msg, json, 'Draft:', draft);
			throw new Error(msg + json);
		}

		// Update the in-memory album with the saved values

		// If it was an image that was saved...
		if (isImagePath(path)) {
			// Get the album in which the image resides
			const albumPath = getParentFromPath(path);
			const album: Album = albumStore.getFromInMemory(albumPath);

			// Get the image
			const image: Image = !album.images
				? null
				: album.images.find((image: Image) => image.path === path);
			
			if (!image)
				throw new Error(
					`Could not find image [${path}] in album [${albumPath}]`
				);
			
			// Apply contents of draft to image
			// This actually updates the object in the Svelte store,
			// but svelte doesn't know it; Svelte only detects when top-level object changes
			Object.assign(image, draft.content);

			// ok, it's updated in the Svelte store now, but svelte doesn't know it; Svelte only detects when top-level object changes
			// also, it's not written to the browser's local disk cache so the next page load the value will be wrong
			// this call does those things
			albumStore.updateAlbum(album);
		}
		// Else it was an album that was saved...
		else {
			const album: Album = albumStore.getFromInMemory(path);
			// This actually updates the object in the Svelte store,
			// but svelte doesn't know it; Svelte only detects when top-level object changes
			Object.assign(album, draft.content);

			// ok, it's updated in the Svelte store now, but svelte doesn't know it; Svelte only detects when top-level object changes
			// also, it's not written to the browser's local disk cache so the next page load the value will be wrong
			// this call does those things
			albumStore.updateAlbum(album);
		}

		this.setStatus(DraftStatus.SAVED);

		// For some types of albums, update the cache of the album on the server
		if (isAlbumPath(path)) {
			const albumType = getAlbumType(path);
			// If it's a year album, update its cache
			if (albumType === AlbumType.YEAR) {
				//TODO updateAlbumServerCache(path);
				console.log(`TODO: I'm a year album, update my cache`);
			} else if (albumType === AlbumType.DAY) {
				// If it's a day album, update parent year album
				//TODO updateAlbumServerCache(getParentFromPath(path));
				console.log(`TODO: update cache of parent year album`);
			}
		}
	
		// Clear the saved status after a while
		setTimeout(() => {
			// Only clear saved status if the status is actually still saved
			if (get(this._draft).status == DraftStatus.SAVED) {
				this.setStatus(DraftStatus.NO_CHANGES);
			}
		}, 4000)
	}
	
	/**
	 * There was an error saving the draft
	 */
	private handleSaveError(e) {
		console.log("Error saving draft: ", e);
		this.setStatus(DraftStatus.ERRORED);
	}

	/**
	 * Change the status of the draft
	 */
	private setStatus(newStatus: DraftStatus): void {
		const state = produce(get(this._draft), newState => { 
			newState.status = newStatus;
		})
		this._draft.set(state);
	}
	
	/**
	 * Update the content of the draft
	 */
	private updateContent(applyChangesToDraftContent: (draftContent: DraftContent) => void): void {
		const newState: Draft = produce(get(this._draft), originalState => {
			originalState.status = DraftStatus.UNSAVED_CHANGES;
			applyChangesToDraftContent(originalState.content);
		});
		console.log("Update draft: ", newState.content);
		this._draft.set(newState);
	}

}

export default new DraftStore();