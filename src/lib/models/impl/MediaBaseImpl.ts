import type { MediaRecord, Rectangle } from './server';
import type { Album, Media, MediaType, Thumbable, ThumbnailUrlInfo } from '../GalleryItemInterfaces';
import { ThumbableBaseImpl } from './ThumbableBaseImpl';
import { detailImageUrl } from '$lib/utils/config';
import { toTitleFromFilename } from '$lib/utils/titleUtils';

/**
 * Base class for media items (images and videos).
 * Consolidates shared logic for navigation, detail sizing, and album relationship.
 */
export abstract class MediaBaseImpl extends ThumbableBaseImpl implements Media {
    protected override readonly json: MediaRecord;
    readonly #album: Album;

    constructor(json: MediaRecord, album: Album) {
        super(json);
        this.json = json;
        this.#album = album;
    }

    abstract get mediaType(): MediaType;

    // Thumbable implementations

    get title(): string {
        return this.json?.title ?? toTitleFromFilename(this.json.itemName);
    }

    set title(title: string) {
        this.json.title = title;
    }

    get summary(): string {
        return '';
    }

    get href(): string {
        return this.path;
    }

    get thumbnailUrlInfo(): ThumbnailUrlInfo {
        return {
            imagePath: this.path,
            versionId: this.json.versionId,
            crop: this.json.thumbnail,
        };
    }

    // Media-specific properties

    get versionId(): string {
        return this.json.versionId;
    }

    get thumbnail(): Rectangle | undefined {
        return this.json.thumbnail;
    }

    get parentTitle(): string {
        return this.#album.title;
    }

    // Detail image/poster sizing

    get detailUrl(): string {
        const width = this.detailWidth;
        const height = this.detailHeight;
        const sizing = width > height ? width.toString() : 'x' + height.toString();
        return detailImageUrl(this.json.path, this.json.versionId, sizing);
    }

    get detailWidth(): number {
        const width = this.json.dimensions.width;
        const height = this.json.dimensions.height;
        if (!width) {
            return 1024;
        } else if (!height || width > height) {
            return width < 1024 ? width : 1024;
        } else {
            return Math.round(1024 * (width / height));
        }
    }

    get detailHeight(): number {
        const width = this.json.dimensions.width;
        const height = this.json.dimensions.height;
        if (!height) {
            return 1024;
        } else if (!width || height > width) {
            return height < 1024 ? height : 1024;
        } else {
            return Math.round(1024 * (height / width));
        }
    }

    // Navigation within album

    get nextHref(): string | undefined {
        return this.#next?.path;
    }

    get prevHref(): string | undefined {
        return this.#prev?.path;
    }

    get nextTitle(): string | undefined {
        return this.#next?.title;
    }

    get prevTitle(): string | undefined {
        return this.#prev?.title;
    }

    get #next(): Thumbable | undefined {
        let foundMyself = false;
        return this.#album.media?.find((item) => {
            if (foundMyself) {
                return true;
            }
            if (item.path === this.path) {
                foundMyself = true;
            }
            return false;
        });
    }

    get #prev(): Thumbable | undefined {
        let prev: Thumbable | undefined;
        this.#album.media?.find((item) => {
            if (item.path === this.path) {
                return true;
            }
            prev = item;
            return false;
        });
        return prev;
    }
}
