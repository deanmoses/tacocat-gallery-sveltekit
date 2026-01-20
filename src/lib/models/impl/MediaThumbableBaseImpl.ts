import type { MediaRecord } from './server';
import type { MediaType, Thumbable, ThumbnailUrlInfo } from '../GalleryItemInterfaces';
import { ThumbableBaseImpl } from './ThumbableBaseImpl';
import { toTitleFromFilename } from '$lib/utils/titleUtils';

/**
 * Base class for media thumbables (search results context).
 * For media items within an album context, use MediaBaseImpl instead.
 */
export abstract class MediaThumbableBaseImpl extends ThumbableBaseImpl implements Thumbable {
    protected override readonly json: MediaRecord;

    #summary: string | undefined;

    constructor(json: MediaRecord) {
        super(json);
        this.json = json;
    }

    abstract get mediaType(): MediaType;

    get title(): string {
        return this.json?.title ?? toTitleFromFilename(this.json.itemName);
    }

    set title(title: string) {
        this.json.title = title;
    }

    get summary() {
        return this.#summary ?? '';
    }

    set summary(summary: string) {
        this.#summary = summary;
    }

    get href(): string {
        return this.path;
    }

    get versionId(): string {
        return this.json.versionId;
    }

    get thumbnailUrlInfo(): ThumbnailUrlInfo {
        return {
            imagePath: this.path,
            versionId: this.json.versionId,
            crop: this.json.thumbnail,
        };
    }
}
