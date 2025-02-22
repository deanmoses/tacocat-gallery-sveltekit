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
 * The state of an album
 */
export type AlbumEntry = {
    status: AlbumStatus;
    path?: string;
    album?: Album;
    /** Album is being renamed, this will be the new path */
    newPath?: string;
    errorMessage?: string;
};

/**
 * Album states that are mutually exclusive
 */
export enum AlbumStatus {
    /** The album has not been loaded and nobody's asked for it */
    NOT_LOADED = 'NOT_LOADED.IDLE',
    /** The album is not loaded because there was an error loading */
    LOAD_ERRORED = 'NOT_LOADED.IDLE.ERROR.LOADING',
    /** The album has not been loaded but it's being retrieved */
    LOADING = 'NOT_LOADED.LOADING',
    /** The album does not exist, we checked on the server */
    DOES_NOT_EXIST = 'DOES_NOT_EXIST.IDLE',
    /** The album does not exist, we tried creating it but there was an error */
    CREATE_ERRORED = 'DOES_NOT_EXIST.IDLE.ERROR.CREATING',
    /** The ablum is in the process of being created  */
    CREATING = 'DOES_NOT_EXIST.CREATING',
    /** The album does not exist because it was deleted */
    DELETED = 'DOES_NOT_EXIST.DELETED',
    /** The album does not exist because it was renamed */
    RENAMED = 'DOES_NOT_EXIST.RENAMED',
    /** The album has been loaded and is ready for further interaction */
    LOADED = 'LOADED.IDLE',
    /** The album is loaded and ready to interact with.  Last interaction was an error saving. */
    SAVE_ERRORED = 'LOADED.IDLE.ERROR.SAVING',
    /** The album is loaded and ready to interact with.  Last interaction was an error renaming. */
    RENAME_ERRORED = 'LOADED.IDLE.ERROR.RENAMING',
    /** The album is loaded and ready to interact with.  Last interaction was an error deleting. */
    DELETE_ERRORED = 'LOADED.IDLE.ERROR.DELETING',
    /** The album is in the process of being saved */
    SAVING = 'LOADED.SAVING',
    /** The album is in the process of being renamed */
    RENAMING = 'LOADED.RENAMING',
    /** The album is in the process of being deleted */
    DELETING = 'LOADED.DELETING',
}

/**
 * Status of subsequent reload to the album
 *
 * Reload status is different than load status:
 * reloads are AFTER the initial album has loaded.
 */
export enum ReloadStatus {
    NOT_RELOADING = 'NOT_RELOADING',
    RELOADING = 'RELOADING',
    ERROR_RELOADING = 'ERROR_RELOADING',
}

/**
 * The state of an image
 */
export type ImageEntry = {
    status: ImageStatus;
    upload?: UploadEntry;
    rename?: RenameEntry;
    crop?: CropEntry;
};

export enum ImageStatus {
    UPLOAD_QUEUED = 'UPLOAD_QUEUED',
    UPLOAD_TRANSFERRING = 'UPLOAD_TRANSFERRING',
    UPLOAD_PROCESSING = 'UPLOAD_PROCESSING',
    CROPPING = 'CROPPING',
    RENAMING = 'RENAMING',
    DELETING = 'DELETING',
}

/**
 * Represents a single image being uploaded
 */
export type UploadEntry = {
    file: File;
    imagePath: string;
    /** S3 VersionId of newly uploaded image */
    versionId?: string;
};

/**
 * Represents a single image being renamed
 */
export type RenameEntry = {
    newPath: string;
};

/**
 * Represents the state of a thumbnail being cropped
 */
export type CropEntry = {
    crop: Crop;
};

export type Crop = { x: number; y: number; height: number; width: number };
