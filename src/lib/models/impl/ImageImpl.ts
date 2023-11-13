import type { ImageRecord } from './server';
import type { Album, Image, Thumbable } from '../GalleryItemInterfaces';
import { ImageThumbableImpl } from './ImageThumbableImpl';

export class ImageImpl extends ImageThumbableImpl implements Image {
    protected override readonly json: ImageRecord;
    private readonly album: Album;

    constructor(json: ImageRecord, album: Album) {
        super(json);
        this.json = json;
        this.album = album;
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
