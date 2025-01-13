import type { ImageRecord } from './server';
import type { Thumbable } from '../GalleryItemInterfaces';
import { ThumbableBaseImpl } from './ThumbableBaseImpl';
import { thumbnailUrl } from '$lib/utils/config';
import { toTitleFromFilename } from '$lib/utils/titleUtils';

export class ImageThumbableImpl extends ThumbableBaseImpl implements Thumbable {
    protected override readonly json: ImageRecord;

    #summary: string | undefined;

    constructor(json: ImageRecord) {
        super(json);
        this.json = json;
    }

    get title(): string {
        return this.json?.title ?? toTitleFromFilename(this.json.itemName);
    }

    set title(title: string) {
        this.json.title = title;
    }

    get summary() {
        return this.#summary ?? '';
    }

    set summary(summary: string) {
        this.#summary = summary;
    }

    get href(): string {
        return this.path;
    }

    get versionId(): string {
        return this.json.versionId;
    }

    get thumbnailUrl(): string {
        return thumbnailUrl(this.path, this.json.versionId, this.json.thumbnail);
    }
}
