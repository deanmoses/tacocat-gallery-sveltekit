/**
 * An unsaved draft edit of an album or an image
 */
export type Draft = {
    path: string;
    status?: DraftStatus;
    content?: DraftContent;
};

export enum DraftStatus {
    NO_CHANGES = 'NO_CHANGES',
    UNSAVED_CHANGES = 'UNSAVED_CHANGES',
    SAVING = 'SAVING',
    SAVED = 'SAVED',
    ERRORED = 'ERRORED',
}

/**
 * Actual drafted content.
 *
 * Could represent changes to
 * either an album or an image.
 */
export type DraftContent = {
    title?: string;
    description?: string;
    published?: boolean;
    summary?: string;
};
