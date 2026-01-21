import type { GalleryRecord } from './server';
import type { ItemType, Thumbable, ThumbnailUrlInfo } from '../GalleryItemInterfaces';

export abstract class ThumbableBaseImpl implements Thumbable {
    protected readonly json: GalleryRecord;

    constructor(json: GalleryRecord) {
        this.json = json;
    }

    abstract get title(): string;
    abstract get summary(): string;
    abstract get href(): string;
    abstract get thumbnailUrlInfo(): ThumbnailUrlInfo | undefined;

    get path(): string {
        return this.json.path;
    }

    protected get parentPath(): string {
        return this.json.parentPath;
    }

    protected get itemName(): string {
        return this.json.itemName;
    }

    get itemType(): ItemType {
        const serverType = this.json.itemType;
        if (serverType === 'album') return 'album';
        if (serverType === 'media' || serverType === 'image') return 'media';
        throw new Error(`Unknown itemType: ${serverType}`);
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
