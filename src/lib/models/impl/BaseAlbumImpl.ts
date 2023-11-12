import { albumPathToDate } from '$lib/utils/galleryPathUtils';
import type { AlbumGalleryItem, GalleryRecord } from '../server';
import type { Album, Image } from './GalleryItemInterfaces';
import { BaseGalleryItemImpl } from './BaseGalleryItemImpl';
import { ImageImpl } from './ImageImpl';

export abstract class BaseAlbumImpl extends BaseGalleryItemImpl implements Album {
    protected override json: AlbumGalleryItem;

    constructor(json: AlbumGalleryItem) {
        super(json);
        this.json = json;
    }

    abstract get title(): string;
    abstract get parentTitle(): string;
    abstract get prevTitle(): string | undefined;
    abstract get nextTitle(): string | undefined;

    get published(): boolean {
        return this.json.published ?? false;
    }

    protected get date(): Date {
        return albumPathToDate(this.path);
    }

    get href(): string {
        return this.path.slice(0, -1); // slice off trailing slash
    }

    get parentHref(): string {
        return this.json.parentPath.slice(0, -1); // slice off trailing slash
    }

    get nextHref(): string | undefined {
        return this?.next?.slice(0, -1); // slice off trailing slash
    }

    get prevHref(): string | undefined {
        return this?.prev?.slice(0, -1); // slice off trailing slash
    }

    protected get next(): string | undefined {
        return this.json?.next?.path;
    }

    protected get prev(): string | undefined {
        return this.json?.prev?.path;
    }

    get thumbnailUrl(): string | undefined {
        console.log('TODO IMPLEMENT FOR REAL');
        return this.json?.thumbnail?.path;
        //return 'https://cdn.tacocat.com/zenphoto/cache/2023/10-29/halloween_party32_200_w200_h200_cw200_ch200_thumb.jpg?cached=1698637062';
    }

    set thumbnailUrl(thumbnailUrl: string) {
        console.log(`TODO IMPLEMENT ${thumbnailUrl}`);
    }

    get images(): Image[] {
        if (!this.json?.children) return [];
        return this.json?.children.filter((child) => child?.itemType == 'image').map((i) => new ImageImpl(i, this));
    }

    get albums(): GalleryRecord[] {
        if (!this.json?.children) return [];
        return this.json?.children.filter((child) => child?.itemType == 'album');
    }

    /**
     * Return image at specified path
     */
    getImage(imagePath: string): Image | undefined {
        const image = this.json?.children?.find((child: GalleryRecord) => child.path === imagePath);
        if (image) {
            return new ImageImpl(image, this);
        }
    }
}
