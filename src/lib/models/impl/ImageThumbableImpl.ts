import type { ImageRecord } from './server';
import type { Thumbable } from '../GalleryItemInterfaces';
import { ThumbableBaseImpl } from './ThumbableBaseImpl';

export class ImageThumbableImpl extends ThumbableBaseImpl implements Thumbable {
    protected override readonly json: ImageRecord;

    constructor(json: ImageRecord) {
        super(json);
        this.json = json;
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
}
