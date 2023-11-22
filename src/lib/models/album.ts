/**
 * Types of albums
 */
export enum AlbumType {
    ROOT = 'ROOT',
    YEAR = 'YEAR',
    DAY = 'DAY',
}

/**
 * Status of the initial load of the album
 */
export enum AlbumLoadStatus {
    /** The album has never been loaded and nobody's asked for it */
    NOT_LOADED = 'NOT_LOADED',
    /** The album has never been loaded but it's being retrieved */
    LOADING = 'LOADING',
    /** The album has never been loaded because there was an error loading the album. */
    ERROR_LOADING = 'ERROR_LOADING',
    /** The album definitely does not exist */
    DOES_NOT_EXIST = 'DOES_NOT_EXIST',
    /** The album has been loaded */
    LOADED = 'LOADED',
}

/**
 * Status of subsequent updates to the album
 *
 * Update status is different than load status: updates are AFTER the
 * initial album has loaded.  You are refreshing the existing album.
 */
export enum AlbumUpdateStatus {
    NOT_UPDATING = 'NOT_UPDATING',
    UPDATING = 'UPDATING',
    ERROR_UPDATING = 'ERROR_UPDATING',
}

/**
 * An entry in a rename store
 * Represents a single item being renamed
 */
export type RenameEntry = {
    oldPath: string;
    newPath: string;
    status: RenameState;
    errorMessage?: string;
};

export enum RenameState {
    IN_PROGRESS = 'In Progress',
    ERROR = 'Error',
}
