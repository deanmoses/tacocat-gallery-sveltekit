import type { DeleteEntry, CropEntry as CropEntry, RenameEntry, UploadEntry } from '$lib/models/album';
import { SvelteMap } from 'svelte/reactivity';

class GlobalStore {
    albumRenames = new SvelteMap<string, RenameEntry>();
    albumDeletes = new SvelteMap<string, DeleteEntry>();
    imageRenames = new SvelteMap<string, RenameEntry>();
    imageDeletes = new SvelteMap<string, DeleteEntry>();
    crops = new SvelteMap<string, CropEntry>();
    uploads: UploadEntry[] = [];

    getUploadsForAlbum(albumPath: string): UploadEntry[] {
        return this.uploads.filter((upload) => upload.imagePath.startsWith(albumPath));
    }

    getUpload(imagePath: string): UploadEntry | undefined {
        return this.uploads.find((upload) => upload.imagePath === imagePath);
    }
}
export const globalStore = new GlobalStore();
