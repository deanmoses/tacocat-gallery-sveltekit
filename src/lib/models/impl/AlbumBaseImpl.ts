import { albumPathToDate } from '$lib/utils/galleryPathUtils';
import type { AlbumGalleryItem, AlbumRecord, GalleryRecord, ImageRecord } from './server';
import type { Album, Image, Thumbable } from '../GalleryItemInterfaces';
import { ThumbableBaseImpl } from './ThumbableBaseImpl';
import { ImageImpl } from './ImageImpl';
import toAlbum from './AlbumCreator';
import { thumbnailUrl } from '$lib/utils/config';

export abstract class AlbumBaseImpl extends ThumbableBaseImpl implements Album {
    override readonly json: AlbumGalleryItem;

    constructor(json: AlbumGalleryItem) {
        super(json);
        this.json = json;
    }

    abstract get parentTitle(): string;
    abstract get prevTitle(): string | undefined;
    abstract get nextTitle(): string | undefined;

    override get published(): boolean {
        return this.json.published ?? false;
    }

    override set published(published: boolean) {
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

    get thumbnailPath(): string | undefined {
        return this.json?.thumbnail?.path;
    }

    set thumbnailPath(imagePath: string) {
        // TODO: fix TypeScript error - thumbnail.versionId is required
        // The Drafts system should probably not be saving to this object,
        // but instead some intermediate object...
        this.json.thumbnail = {
            path: imagePath,
        };
    }

    get thumbnailUrl(): string | undefined {
        return this.json?.thumbnail?.path
            ? thumbnailUrl(this.json.thumbnail.path, this.json.thumbnail.versionId, this.json.thumbnail.crop)
            : undefined;
    }

    get images(): Thumbable[] {
        if (!this.json?.children) return [];
        return this.json?.children
            .filter((child) => child?.itemType == 'image')
            .map((i) => new ImageImpl(i as ImageRecord, this));
    }

    get albums(): Thumbable[] {
        if (!this.json?.children) return [];
        return this.json?.children.filter((child) => child?.itemType == 'album').map((i) => toAlbum(i as AlbumRecord));
    }

    getImage(imagePath: string): Image | undefined {
        const image = this.json?.children?.find((child: GalleryRecord) => child.path === imagePath);
        return !!image ? new ImageImpl(image as ImageRecord, this) : undefined;
    }
}
