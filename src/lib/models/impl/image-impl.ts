import type { Album, Image } from '$lib/models/album';
import { processCaption } from '$lib/utils/legacyUrlHandler';

/**
 * Image implementation
 */
export class ImageImpl implements Image {
    path: string;
    itemName: string;
    itemType?: string;
    title?: string;
    date: number;
    description?: string;
    unpublished: boolean;
    url_full: string;
    url_sized: string;
    url_thumb: string;
    width: number;
    height: number;
    album: Album;

    constructor(album: Album) {
        this.album = album;
    }

    get pageTitle(): string {
        return this.title ?? '';
    }

    get pageDescription(): string {
        return processCaption(this.description);
    }

    /**
     * URL of next image in my album
     */
    get nextImageHref(): string | undefined {
        return this.next?.path;
    }

    /**
     * URL of previous image in my album
     */
    get prevImageHref(): string | undefined {
        return this.prev?.path;
    }

    /**
     * Next image in my album
     */
    private get next(): Image | undefined {
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

    /**
     * Previous image in my album
     */
    private get prev(): Image | undefined {
        let prev: Image | undefined; // image I will be returning
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
