import type { Album } from './GalleryItemInterfaces';

/**
 * Types of albums
 */
export enum AlbumType {
    ROOT = 'ROOT',
    YEAR = 'YEAR',
    DAY = 'DAY',
}

/**
 * An entry in the album store
 */
export type AlbumEntry = {
    loadStatus: AlbumLoadStatus;
    renameEntry?: RenameEntry;
    album?: Album;
};

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
 * Represents a single album being created
 */
export type AlbumCreateEntry = {
    status: AlbumCreateState;
};

/**
 * Status of the create of a single album
 */
export enum AlbumCreateState {
    IN_PROGRESS = 'In Progress',
}

/**
 * Represents a single image being uploaded
 */
export type UploadEntry = {
    file: File;
    imagePath: string;
    status: UploadState;
    /** S3 VersionId of newly uploaded image */
    versionId?: string;
};

/**
 * Status of of the upload of a single image
 */
export enum UploadState {
    UPLOAD_NOT_STARTED = 'Not Started',
    UPLOADING = 'Uploading',
    PROCESSING = 'Processing',
}

/**
 * Represents a single image or album being renamed
 */
export type RenameEntry = {
    oldPath: string;
    newPath: string;
    status: RenameStatus;
};

export enum RenameStatus {
    IN_PROGRESS = 'In Progress',
}

/**
 * Represents a single album or image being deleted
 */
export type DeleteEntry = {
    status: DeleteStatus;
};

export enum DeleteStatus {
    IN_PROGRESS = 'In Progress',
}

/**
 * Represents the state of a thumbnail being cropped
 */
export type CropEntry = {
    imagePath: string;
    crop: Crop;
    status: CropStatus;
};

export type Crop = { x: number; y: number; height: number; width: number };

export enum CropStatus {
    IN_PROGRESS = 'In Progress',
}
