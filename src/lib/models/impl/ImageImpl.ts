import type { ImageRecord } from './server';
import type { Album, Image } from '../GalleryItemInterfaces';
import { MediaBaseImpl } from './MediaBaseImpl';
import { originalMediaUrl } from '$lib/utils/config';

export class ImageImpl extends MediaBaseImpl implements Image {
    protected override readonly json: ImageRecord;

    constructor(json: ImageRecord, album: Album) {
        super(json, album);
        this.json = json;
    }

    get mediaType(): 'image' {
        return 'image';
    }

    get originalUrl(): string {
        return originalMediaUrl(this.json.path);
        // TODO: implement cachebuster with the versionId
    }

    get originalWidth(): number {
        return this.json.dimensions.width;
    }

    get originalHeight(): number {
        return this.json.dimensions.height;
    }
}
