import { albumPathToDate } from '$lib/utils/galleryPathUtils';
import type { AlbumGalleryItem, AlbumRecord, GalleryRecord, MediaRecord } from './server';
import { isAlbumRecord, isMediaRecord } from './server';
import type { Album, Media, Thumbable, ThumbnailUrlInfo } from '../GalleryItemInterfaces';
import { ThumbableBaseImpl } from './ThumbableBaseImpl';
import toAlbum from './AlbumCreator';
import { toMedia } from './GalleryItemCreator';

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
        // @ts-expect-error Incomplete thumbnail - versionId and fileUpdatedOn set by server
        this.json.thumbnail = {
            path: imagePath,
        };
    }

    get thumbnailUrlInfo(): ThumbnailUrlInfo | undefined {
        return this.json?.thumbnail?.path && this.json.thumbnail.versionId
            ? {
                  imagePath: this.json.thumbnail.path,
                  versionId: this.json.thumbnail.versionId,
                  crop: this.json.thumbnail.crop,
              }
            : undefined;
    }

    get media(): Media[] {
        if (!this.json?.children) return [];
        return this.json?.children
            .filter((child) => child && isMediaRecord(child))
            .map((record) => toMedia(record as MediaRecord, this));
    }

    get albums(): Thumbable[] {
        if (!this.json?.children) return [];
        return this.json?.children
            .filter((child) => child && isAlbumRecord(child))
            .map((record) => toAlbum(record as AlbumRecord));
    }

    getMedia(mediaPath: string): Media | undefined {
        const record = this.json?.children?.find((child: GalleryRecord) => child.path === mediaPath);
        if (!record || !isMediaRecord(record)) return undefined;
        return toMedia(record, this);
    }
}
