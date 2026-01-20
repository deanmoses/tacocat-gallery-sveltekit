import type { VideoRecord } from './server';
import type { Album, Video } from '../GalleryItemInterfaces';
import { MediaBaseImpl } from './MediaBaseImpl';

export class VideoImpl extends MediaBaseImpl implements Video {
    protected override readonly json: VideoRecord;

    constructor(json: VideoRecord, album: Album) {
        super(json, album);
        this.json = json;
    }

    get mediaType(): 'video' {
        return 'video';
    }

    get id(): string {
        return this.json.id;
    }

    get duration(): number {
        return this.json.duration;
    }
}
