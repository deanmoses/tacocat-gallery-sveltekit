import type { Album, Image, AlbumNavInfo, AlbumThumb } from '$lib/models/album';
import { ImageImpl } from '$lib/models/impl/image-impl';
import { getParentAndNameFromPath, isValidAlbumPath } from '$lib/utils/galleryPathUtils';
import { processCaption } from '$lib/utils/legacyUrlHandler';

/**
 * Album implementation
 */
export class AlbumImpl implements Album {
    parentPath: string;
    itemName: string;
    path: string;
    updatedOn?: string;
    title?: string;
    customdata?: string;
    unpublished?: boolean;

    /**
     * Unprocessed album text / photo caption.
     * Don't display this in the UI; instead use the #description property.
     * This exists because it's set directly from the JSON API.
     * @see pageDescription
     */
    description?: string;
    image_size?: number;
    thumb_size?: number;
    itemType?: string;
    private thumbnail?: { path: string; fileUpdatedOn: string };
    private children?: AlbumThumb[] | Image[];
    next?: AlbumNavInfo;
    prev?: AlbumNavInfo;

    constructor(path: string) {
        if (!isValidAlbumPath(path)) throw new Error(`Invalid album path [${path}]`);
        this.path = path;
        const pathParts = getParentAndNameFromPath(path);
        this.parentPath = pathParts.parent;
        this.itemName = pathParts.name ?? '';
    }

    get url_thumb(): string | undefined {
        return this.thumbnail?.path;
    }

    get pageTitle(): string {
        return this.title ?? '';
    }

    get pageDescription(): string {
        return processCaption(this.description);
    }

    /**
     * URL to screen displaying album, like /2014/12-31
     */
    get href(): string {
        return this.path;
    }

    /**
     * URL to album thumbnail
     * Blank if no thumbnail
     */
    get thumbnailUrl(): string {
        return this.thumbnail?.path ?? '';
    }

    /**
     * URL to next album, including hash
     * Blank if no next album
     */
    get nextAlbumHref(): string {
        return this.next?.path ? this.next.path.slice(0, -1) : '';
    }

    /**
     * URL to previous album, including hash
     * Blank if no previous album
     */
    get prevAlbumHref(): string {
        return this.prev ? this.prev.path.slice(0, -1) : '';
    }

    /**
     * Title of next album
     * Blank if no next album
     */
    get nextAlbumTitle(): string {
        return this.next?.title ?? '';
    }

    /**
     * Title of previous album
     * Blank if no previous album
     */
    get prevAlbumTitle(): string {
        return this.prev?.title ?? '';
    }

    get images(): Image[] {
        if (!this.children) return [];
        return this.children.filter((child) => child?.itemType == 'image');
    }

    get albums(): AlbumThumb[] {
        if (!this.children) return [];
        return this.children.filter((child) => child?.itemType == 'album');
    }

    /**
     * Return image at specified path
     */
    getImage(imagePath: string): Image | undefined {
        if (this.images) {
            const image = this.images.find((image: Image) => image.path === imagePath);
            if (image) {
                return Object.assign(new ImageImpl(this), image);
            }
        }
        return undefined;
    }
}
