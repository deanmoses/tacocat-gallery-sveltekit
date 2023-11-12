import type { ImageRecord } from '../server';
import type { Album, Image } from './GalleryItemInterfaces';
import { BaseGalleryItemImpl } from './BaseGalleryItemImpl';

export class ImageImpl extends BaseGalleryItemImpl implements Image {
    override json: ImageRecord;
    private album: Album;

    constructor(json: ImageRecord, album: Album) {
        super(json);
        this.json = json;
        this.album = album;
    }

    get title(): string {
        return this.json?.title ?? this.json.itemName;
    }

    get href(): string {
        return this.path;
    }

    get thumbnailUrl(): string {
        // TODO: implement for real
        return 'https://cdn.tacocat.com/zenphoto/cache/2023/10-29/halloween_party32_200_w200_h200_cw200_ch200_thumb.jpg?cached=1698637062';
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
