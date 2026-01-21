import type { VideoRecord } from './server';
import { MediaThumbableBaseImpl } from './MediaThumbableBaseImpl';

export class VideoThumbableImpl extends MediaThumbableBaseImpl {
    protected override readonly json: VideoRecord;

    constructor(json: VideoRecord) {
        super(json);
        this.json = json;
    }

    get mediaType(): 'video' {
        return 'video';
    }
}
