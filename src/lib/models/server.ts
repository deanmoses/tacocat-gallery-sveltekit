//
// THESE TYPES ARE WHAT COMES FROM THE SERVER
//

//
// GALLERY ITEM DECLARATIONS
// A Gallery Item is a composition of multiple records
// like Album gallery item contains children
//

export type GalleryItem = AlbumGalleryItem /*| ImageGalleryItem*/;

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

export type GalleryRecord = AlbumRecord | ImageRecord;

export type ImageRecord = BaseGalleryRecord & {
    title?: string;
    tags?: string[];
};

export type AlbumRecord = BaseGalleryRecord & {
    published?: boolean;
    thumbnail?: AlbumThumbnailRecord;
};

export type AlbumThumbnailRecord = {
    path: string;
    fileUpdatedOn: string;
};

type BaseGalleryRecord = {
    path: string;
    parentPath: string;
    itemName: string;
    itemType: GalleryItemType;
    updatedOn: string;
    description?: string;
    summary?: string;
};

export type GalleryItemType = 'album' | 'image';
