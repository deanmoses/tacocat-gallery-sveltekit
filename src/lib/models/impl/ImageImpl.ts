import type { ImageRecord } from './server';
import type { Album, Image, Thumbable } from '../GalleryItemInterfaces';
import { GalleryItemBaseImpl } from './GalleryItemBaseImpl';

export class ImageImpl extends GalleryItemBaseImpl implements Image {
    protected override readonly json: ImageRecord;
    private readonly album: Album;

    constructor(json: ImageRecord, album: Album) {
        super(json);
        this.json = json;
        this.album = album;
    }

    get title(): string {
        return this.json?.title ?? this.json.itemName;
    }

    set title(title: string) {
        this.json.title = title;
    }

    get href(): string {
        return this.path;
    }

    get thumbnailUrl(): string {
        // TODO: implement for real
        return 'https://cdn.tacocat.com/zenphoto/cache/2023/10-29/halloween_party32_200_w200_h200_cw200_ch200_thumb.jpg?cached=1698637062';
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
