import { processCaption } from '$lib/utils/legacyUrlHandler';
import type { GalleryItemType, GalleryRecord } from '../server';
import type { BaseGalleryItem } from './GalleryItemInterfaces';

export abstract class BaseGalleryItemImpl implements BaseGalleryItem {
    protected json: GalleryRecord;

    constructor(json: GalleryRecord) {
        this.json = json;
    }

    abstract get title(): string;
    abstract get parentTitle(): string;
    abstract get href(): string;
    abstract get thumbnailUrl(): string | undefined;
    abstract get prevTitle(): string | undefined;
    abstract get nextTitle(): string | undefined;
    abstract get prevHref(): string | undefined;
    abstract get nextHref(): string | undefined;

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

    get parentAlbumHref(): string {
        return this.json.parentPath;
    }
}
