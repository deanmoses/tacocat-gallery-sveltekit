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

    get pageDescription(): string {
        return processCaption(this.description);
    }

    /**
     * URL of the next image in my album
     * Undefined if no next image
     */
    get nextImageHref(): string | undefined {
        return this.next?.path;
    }

    /**
     * Next image in my album
     */
    get next(): Image | undefined {
        let foundMyself = false;
        return this.album.images?.find((img) => {
            if (foundMyself) {
                // I don't know my own index in my parent collection, so
                // first I have to find myself, then find the next image.
                return true; // stop iterating on the image AFTER me
            }
            if (img.path === this.path) {
                foundMyself = true;
            }
            return false; // keep iterating
        });
    }

    /**
     * URL of the previous image in my album
     * Undefined if no previous image
     */
    get prevImageHref(): string | undefined {
        const prev = this.prev;
        return prev ? '/' + prev.path : undefined;
    }

    /**
     * Image.path of the previous image in my album
     * Undefined if no previous image
     */
    get prevImagePath(): string | undefined {
        const prev = this.prev;
        return prev ? prev.path : undefined;
    }

    /**
     * Previous image in my album
     */
    get prev(): Image | undefined {
        let prev: Image | undefined; // image I will be returning
        this.album.images?.find((img) => {
            // I don't know my own index in my parent collection.
            // But I do know that once I find myself, I will have
            // already found my prev in the previous iteration.
            if (img.path === this.path) {
                return true; // stop iterating once I've found myself
            }
            prev = img;
            return false; // keep iterating
        });
        return prev;
    }
}
