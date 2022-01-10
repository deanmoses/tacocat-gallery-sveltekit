/**
 * An unsaved draft edit of an album or an image
 */
export type Draft = {
	path: string;
	status?: DraftStatus;
	content?: DraftContent;
	errorMessage?: string;
};

export enum DraftStatus {
	NO_CHANGES = 'NO_CHANGES',
	UNSAVED_CHANGES = 'UNSAVED_CHANGES',
	SAVING = 'SAVING',
	SAVED = 'SAVED',
	ERRORED = 'ERRORED'
};

export type DraftContent = {
	title?: string;
	desc?: string;
	published?: boolean;
};