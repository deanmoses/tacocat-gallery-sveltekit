import type { GalleryItemType, GalleryRecord } from './server';
import type { Thumbable } from '../GalleryItemInterfaces';

export abstract class ThumbableBaseImpl implements Thumbable {
    protected readonly json: GalleryRecord;

    constructor(json: GalleryRecord) {
        this.json = json;
    }

    abstract get title(): string;
    abstract get summary(): string;
    abstract get href(): string;
    abstract get thumbnailUrl(): string | undefined;

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
        return this.json.description || '';
    }

    set description(description: string) {
        this.json.description = description;
    }

    get parentHref(): string {
        return this.json.parentPath;
    }

    get published(): boolean {
        // TODO: all images are published=false by this logic
        return 'published' in this.json ? !!this.json.published : false;
    }
}
