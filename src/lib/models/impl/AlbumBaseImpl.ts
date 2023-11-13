import { albumPathToDate } from '$lib/utils/galleryPathUtils';
import type { AlbumGalleryItem, GalleryRecord } from './server';
import type { Album, Image, Thumbable } from '../GalleryItemInterfaces';
import { ThumbableBaseImpl } from './ThumbableBaseImpl';
import { ImageImpl } from './ImageImpl';
import toAlbum from './AlbumCreator';

export abstract class AlbumBaseImpl extends ThumbableBaseImpl implements Album {
    protected override readonly json: AlbumGalleryItem;

    constructor(json: AlbumGalleryItem) {
        super(json);
        this.json = json;
    }

    abstract get parentTitle(): string;
    abstract get prevTitle(): string | undefined;
    abstract get nextTitle(): string | undefined;

    get published(): boolean {
        return this.json.published ?? false;
    }

    set published(published: boolean) {
        this.json.published = published;
    }

    override get summary(): string {
        return this.json.summary ?? '';
    }
    override set summary(summary: string) {
        this.json.summary = summary;
    }

    protected get date(): Date {
        return albumPathToDate(this.path);
    }

    get href(): string {
        return this.path.slice(0, -1); // slice off trailing slash
    }

    override get parentHref(): string {
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
        return 'https://cdn.tacocat.com/zenphoto/cache/2023/10-29/halloween_party32_200_w200_h200_cw200_ch200_thumb.jpg?cached=1698637062';
    }

    set thumbnailUrl(thumbnailUrl: string) {
        console.log(`TODO IMPLEMENT FOR REAL ${thumbnailUrl}`);
        this.json.thumbnail = {
            path: thumbnailUrl,
            fileUpdatedOn: new Date().toISOString(),
        };
    }

    get images(): Thumbable[] {
        if (!this.json?.children) return [];
        return this.json?.children.filter((child) => child?.itemType == 'image').map((i) => new ImageImpl(i, this));
    }

    get albums(): Thumbable[] {
        if (!this.json?.children) return [];
        return this.json?.children.filter((child) => child?.itemType == 'album').map((i) => toAlbum(i));
    }

    getImage(imagePath: string): Image | undefined {
        const image = this.json?.children?.find((child: GalleryRecord) => child.path === imagePath);
        return !!image ? new ImageImpl(image, this) : undefined;
    }
}
