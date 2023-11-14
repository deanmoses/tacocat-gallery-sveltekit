import type { ImageRecord } from './server';
import type { Album, Image, Thumbable } from '../GalleryItemInterfaces';
import { ImageThumbableImpl } from './ImageThumbableImpl';
import Config from '$lib/utils/config';

export class ImageImpl extends ImageThumbableImpl implements Image {
    protected override readonly json: ImageRecord;
    private readonly album: Album;

    constructor(json: ImageRecord, album: Album) {
        super(json);
        this.json = json;
        this.album = album;
    }

    get detailUrl(): string {
        let imageProcessingInstructions: string = '';
        if (!this.json.width || !this.json.height) {
            imageProcessingInstructions = '/jpeg/1024';
        } else if (this.json.width > this.json.height) {
            imageProcessingInstructions = '/jpeg/1024';
        } else {
            imageProcessingInstructions = '/jpeg/x1024';
        }
        return Config.detailImagelUrl(this.json.path + imageProcessingInstructions);
        // TODO: implement cachebuster like this: 'https://cdn.tacocat.com/zenphoto/cache/2023/10-29/halloween_party32_200_w200_h200_cw200_ch200_thumb.jpg?cached=1698637062';
    }

    get originalUrl(): string {
        return Config.originalImageUrl(this.json.path);
        // TODO: implement cachebuster like this: 'https://cdn.tacocat.com/zenphoto/cache/2023/10-29/halloween_party32_200_w200_h200_cw200_ch200_thumb.jpg?cached=1698637062';
    }

    get width(): number {
        if (!this.json.width) return 4000; // TODO FIX
        return this.json.width > this.json.height ? 1024 : Math.round(1024 * (this.json.width / this.json.height));
    }

    get height(): number {
        if (!this.json.height) return 4000; // TODO FIX
        return this.json.height > this.json.width ? 1024 : Math.round(1024 * (this.json.height / this.json.width));
    }

    get parentTitle(): string {
        return this.album.title;
    }

    get nextHref(): string | undefined {
        return this.next?.path;
    }

    get prevHref(): string | undefined {
        return this.prev?.path;
    }

    get nextTitle(): string | undefined {
        return this.next?.title;
    }

    get prevTitle(): string | undefined {
        return this.prev?.title;
    }

    private get next(): Thumbable | undefined {
        let foundMyself = false;
        return this.album.images?.find((img) => {
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

    private get prev(): ImageRecord | undefined {
        let prev; // image I will be returning
        this.album.images?.find((img) => {
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
