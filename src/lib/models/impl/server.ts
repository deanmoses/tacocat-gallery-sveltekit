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

//
// RECORD TYPE DECLARATIONS
// A Record is a single row/item/record from DynamoDB
// Doesn't contain information from other records like prev/next or children
//

export type GalleryRecord = AlbumRecord | ImageRecord;

export type ImageRecord = BaseGalleryRecord & {
    versionId: string;
    dimensions: Size;
    thumbnail?: Rectangle;
    title?: string;
    tags?: string[];
};

export type AlbumRecord = BaseGalleryRecord & {
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
export type GalleryItemType = 'album' | 'image';

export type Rectangle = Point & Size;

export type Point = {
    x: number;
    y: number;
};

export type Size = {
    width: number;
    height: number;
};
