/**
 * A Svelte store representing the draft changes to an album or a image
 */

import { writable, type Writable, derived, type Readable, get} from 'svelte/store';
import type { Draft } from '$lib/models/models';
import { DraftStatus } from '$lib/models/models';

const initialState: Draft = {
	status: DraftStatus.UNSAVED_CHANGES,
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
		const initialState: Draft = {
			status: DraftStatus.UNSAVED_CHANGES,
			path: path,
			content: {}
		};
		this._draft.set(initialState);
	}

	/**
	 * @returns the status of the draft
	 */
	getStatus(): Readable<string> {
		return derived(this._draft, ($draft) => {
			return $draft.status;
		});
	}

	/**
	 * Change the status of the draft
	 */
	private setStatus(newStatus: DraftStatus): void {
		this._draft.update((state) => {
			state.status = newStatus;
			return state;
		});
	}
	
	/**
	 * Set the title of the current draft
	 */
	setTitle(title: string): void {
		console.log("draft title: ", title);
		this._draft.update((state) => {
			state.content.title = title;
			return state;
		});
	}

	/**
	 * Set the desc of the current draft
	 */
	setDesc(desc: string): void {
		console.log("draft desc: ", desc);
		this._draft.update((state) => {
			state.content.desc = desc;
			return state;
		});
	}

	setPublished(published: boolean): void {
		console.log("draft published: ", published);
		this._draft.update((state) => {
			state.content.published = published;
			return state;
		});
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
		console.log("TODO: save the draft: ", get(this._draft));
		this.setStatus(DraftStatus.SAVING);
		// Simulate a save
		setTimeout(() => {
			console.log("TODO: saved the draft");
			this.setStatus(DraftStatus.SAVED);
		}, 1000)
	}

}

export default new DraftStore();