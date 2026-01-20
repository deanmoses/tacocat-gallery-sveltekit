//
// THESE TYPES ARE WHAT COMES FROM THE SERVER
// AND WHAT ARE STORED ON LOCAL DISK
//

//
// GALLERY ITEM DECLARATIONS
// A Gallery Item is a composition of multiple records
// like Album gallery item contains children
//

export type GalleryItem = AlbumGalleryItem /*| ImageGalleryItem if I ever need Image-specific fields */;

export type AlbumGalleryItem = AlbumRecord & {
    prev?: AlbumNavInfo;
    next?: AlbumNavInfo;
    children?: GalleryRecord[];
};

export type AlbumNavInfo = {
    path: string;
};

// export type ImageGalleryItem = ImageRecord & {

// };

// export type ImageNavInfo = {
//     path: string;
//     title?: string;
// };

//
// RECORD TYPE DECLARATIONS
// A Record is a single row/item/record from DynamoDB
// Doesn't contain information from other records like prev/next or children
//

/** A gallery record is either an album or a media item (image or video) */
export type GalleryRecord = AlbumRecord | MediaRecord;

/** A media record is either an image or a video */
export type MediaRecord = ImageRecord | VideoRecord;

export type VideoRecord = BaseMediaRecord & {
    /** Distinguishes video from image */
    mediaType: 'video';
    /** URL-safe ID that's globally unique among all gallery items */
    id: string;
    /** Duration in seconds */
    duration: number;
};

/**
 * Images: pre-migration have no mediaType field, post-migration have mediaType: 'image'
 */
export type ImageRecord = BaseMediaRecord & {
    mediaType?: 'image';
};

/** Base for all media items (images and videos) */
type BaseMediaRecord = BaseGalleryRecord & {
    /** 'image' (pre-migration) or 'media' (post-migration) means media item */
    itemType: 'image' | 'media';
    versionId: string;
    dimensions: Size;
    thumbnail?: Rectangle;
    title?: string;
    tags?: string[];
};

export type AlbumRecord = BaseGalleryRecord & {
    itemType: 'album';
    published?: boolean;
    thumbnail?: AlbumThumbnailRecord;
    summary?: string;
};

export type AlbumThumbnailRecord = {
    path: string;
    versionId: string;
    crop?: Rectangle;
    fileUpdatedOn: string;
};

type BaseGalleryRecord = {
    path: string;
    parentPath: string;
    itemName: string;
    itemType: GalleryItemType;
    updatedOn: string;
    description?: string;
};
export type GalleryItemType = 'album' | 'image' | 'media';

export type Rectangle = Point & Size;

export type Point = {
    x: number;
    y: number;
};

export type Size = {
    width: number;
    height: number;
};

//
// TYPE GUARDS
//

export function isAlbumRecord(record: GalleryRecord): record is AlbumRecord {
    return record.itemType === 'album';
}

export function isMediaRecord(record: GalleryRecord): record is MediaRecord {
    // 'image' (pre-migration) or 'media' (post-migration) means media item
    return record.itemType === 'image' || record.itemType === 'media';
}

export function isVideoRecord(record: GalleryRecord): record is VideoRecord {
    return isMediaRecord(record) && 'mediaType' in record && record.mediaType === 'video';
}

export function isImageRecord(record: GalleryRecord): record is ImageRecord {
    if (!isMediaRecord(record)) return false;
    // Old format: no mediaType field; New format: mediaType === 'image'
    return !('mediaType' in record) || record.mediaType === 'image';
}
