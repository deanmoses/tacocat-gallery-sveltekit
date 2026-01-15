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
 * Represents an album being created
 */
export type CreateEntry = {
    status: CreateStatus;
};

export enum CreateStatus {
    IN_PROGRESS = 'In Progress',
}

/**
 * Input data for uploading images (before upload starts)
 */
export type ImageToUpload = {
    file: File;
    /** Path used for S3 upload (e.g., /2024/01-01/photo.heic) */
    uploadPath: string;
    /** For replacements: the S3 versionId of the image being replaced */
    previousVersionId?: string;
};

/**
 * Represents a single image being uploaded
 */
export type UploadEntry = {
    file: File;
    /** Path used for S3 upload (e.g., /2024/01-01/photo.heic) */
    uploadPath: string;
    /** Expected imagePath in album after server processing (e.g., /2024/01-01/photo.jpg for HEIC) */
    imagePath: string;
    status: UploadState;
    /** S3 versionId of newly uploaded image.
     * For file formats that get converted to a different format on the server (like HEIC -> JPG),
     * this will be the versionId of the pre-conversion image, which is not useful */
    versionId?: string;
    /** S3 versionId of image being replaced.
     * For file formats that get converted to a different format on the server (like HEIC -> JPG),
     * detecting when the versionId is no longer this is how we determine the new image has been converted and is ready to use */
    previousVersionId?: string;
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
