import { processCaption } from '$lib/utils/legacyUrlHandler';
import type { GalleryItemType, GalleryRecord } from '../server';

export abstract class BaseGalleryItemImpl {
    protected json: GalleryRecord;

    constructor(json: GalleryRecord) {
        this.json = json;
    }

    get path(): string {
        return this.json.path;
    }

    protected get parentPath(): string {
        return this.json.parentPath;
    }

    protected get itemName(): string {
        return this.json.itemName;
    }

    protected get itemType(): GalleryItemType {
        return this.json.itemType;
    }

    get description(): string {
        return !!this.json.description ? processCaption(this.json.description) : '';
    }

    get summary(): string {
        return !!this.json.summary ? this.json.summary : '';
    }

    get href(): string {
        return this.path;
    }

    get parentAlbumHref(): string {
        return this.json.parentPath;
    }
}
