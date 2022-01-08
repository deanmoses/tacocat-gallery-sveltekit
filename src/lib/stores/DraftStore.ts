/**
 * A Svelte store representing the draft changes to an album or a image
 */

import { writable, type Writable, derived, type Readable, get} from 'svelte/store';
import type { Draft, DraftContent } from '$lib/models/models';
import { DraftStatus } from '$lib/models/models';
import produce from "immer";

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
		this.setStatus(DraftStatus.SAVING);

		console.log("TODO: save the draft: ", get(this._draft));

		// Simulate a save
		setTimeout(() => {
			console.log("TODO: saved the draft");
			this.setStatus(DraftStatus.SAVED);
			
			// Clear the saved status after a while
			setTimeout(() => {
				// Only clear saved status if the status is actually still saved
				if (get(this._draft).status == DraftStatus.SAVED) {
					this.setStatus(DraftStatus.NO_CHANGES);
				}
			}, 4000)
		}, 1000)
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