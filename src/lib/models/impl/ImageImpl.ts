import type { ImageRecord, Rectangle } from './server';
import type { Album, Image, Thumbable } from '../GalleryItemInterfaces';
import { ImageThumbableImpl } from './ImageThumbableImpl';
import { detailImageUrl, originalImageUrl } from '$lib/utils/config';

export class ImageImpl extends ImageThumbableImpl implements Image {
    protected override readonly json: ImageRecord;
    readonly #album: Album;

    constructor(json: ImageRecord, album: Album) {
        super(json);
        this.json = json;
        this.#album = album;
    }

    get originalUrl(): string {
        return originalImageUrl(this.json.path);
        // TODO: implement cachebuster with the versionId
    }

    get originalWidth(): number {
        return this.json.dimensions.width;
    }

    get originalHeight(): number {
        return this.json.dimensions.height;
    }

    get detailUrl(): string {
        const width = this.detailWidth;
        const height = this.detailHeight;
        const sizing = width > height ? width.toString() : 'x' + height.toString();
        return detailImageUrl(this.json.path, this.json.versionId, sizing);
    }

    /** Width of detail image */
    get detailWidth(): number {
        const width = this.originalWidth;
        const height = this.originalHeight;
        if (!width) {
            return 1024;
        } else if (!height || width > height) {
            // Don't enlarge images smaller than 1024
            return width < 1024 ? width : 1024;
        } else {
            return Math.round(1024 * (width / height));
        }
    }

    /** Height of detail image */
    get detailHeight(): number {
        const width = this.originalWidth;
        const height = this.originalHeight;
        // TODO: not sure setting a height of 1024 is correct
        if (!height) {
            return 1024;
        } else if (!width || height > width) {
            // Don't enlarge images smaller than 1024
            return height < 1024 ? height : 1024;
        } else {
            return Math.round(1024 * (height / width));
        }
    }

    get thumbnail(): Rectangle | undefined {
        return this.json.thumbnail;
    }

    get parentTitle(): string {
        return this.#album.title;
    }

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
        return this.#album.images?.find((img) => {
            if (foundMyself) {
                // First find myself then find the next image
                return true; // stop iterating on the image AFTER me
            }
            if (img.path === this.path) {
                foundMyself = true;
            }
            return false; // keep iterating
        });
    }

    get #prev(): ImageRecord | undefined {
        let prev; // image I will be returning
        this.#album.images?.find((img) => {
            // Once I find myself, I will have already found my prev in the previous iteration
            if (img.path === this.path) {
                return true; // stop iterating once I've found myself
            }
            prev = img;
            return false; // keep iterating
        });
        return prev;
    }
}
