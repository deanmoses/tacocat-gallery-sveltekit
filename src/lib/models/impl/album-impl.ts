import type { Album, Image, AlbumNavInfo, AlbumThumb } from '$lib/models/album';
import { ImageImpl } from '$lib/models/impl/image-impl';
import { albumPathToDate, isValidAlbumPath } from '$lib/utils/galleryPathUtils';
import { processCaption } from '$lib/utils/legacyUrlHandler';

/**
 * Album implementation
 */
export class AlbumImpl implements Album {
    path: string;
    updatedOn?: string;
    title?: string;
    customdata?: string;
    unpublished?: boolean;
    desc?: string;
    image_size?: number;
    thumb_size?: number;
    //url_thumb?: string;
    private thumbnail?: { path: string; fileUpdatedOn: string };
    albums?: AlbumThumb[];
    images?: Image[];
    parent_album?: AlbumNavInfo;
    next?: AlbumNavInfo;
    prev?: AlbumNavInfo;

    constructor(path: string) {
        if (!isValidAlbumPath(path)) throw new Error(`Invalid album path [${path}]`);
        this.path = path;
    }

    get date(): Date {
        return albumPathToDate(this.path);
    }

    get url_thumb(): string | undefined {
        return this.thumbnail?.path;
    }

    get description(): string {
        return processCaption(this.desc);
    }

    /**
     * Friendly title of page
     * Blank if no title
     */
    get pageTitle(): string {
        return this.title ?? '';
    }

    /**
     * URL (including hashtag) to screen displaying album, like #2014/12-31
     */
    get href(): string {
        return '/' + this.path;
    }

    get thumbnailUrl(): string {
        return 'TODO IMPLEMENT';
    }

    /**
     * Path of next album
     * Blank if no next album
     */
    get nextAlbumPath(): string {
        return this.next?.path ?? '';
    }

    /**
     * URL to next album, including hash
     * Blank if no next album
     */
    get nextAlbumHref(): string {
        return this.next ? '/' + this.next.path : '';
    }

    /**
     * Path of previous album
     * Blank if no previous album
     */
    get prevAlbumPath(): string {
        return this.prev?.path ?? '';
    }

    /**
     * URL to previous album, including hash
     * Blank if no previous album
     */
    get prevAlbumHref(): string {
        return this.prev ? '/' + this.prev.path : '';
    }

    /**
     * URL to parent album, including hash
     * Blank if no parent album
     */
    get parentAlbumHref(): string {
        return this.parent_album ? '/' + this.parent_album.path : '';
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

    /**
     * Title of parent album
     * Blank if no parent album
     */
    get parentAlbumTitle(): string {
        return this.parent_album?.title ?? '';
    }

    /**
     * Return image at specified path, or undefined
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
