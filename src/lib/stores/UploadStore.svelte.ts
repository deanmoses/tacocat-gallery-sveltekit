import { UploadState, type UploadEntry } from '$lib/models/album';

/**
 * Store of photos being uploaded
 */
class AlbumUploadStore {
    /**
     * Private writable store
     */
    #uploads: UploadEntry[] = [];

    /**
     * Public read-only version of store
     */
    readonly uploads: ReadonlyArray<UploadEntry> = $derived(this.#uploads);

    getUploadsForAlbum(albumPath: string): ReadonlyArray<UploadEntry> {
        return this.#uploads.filter((upload) => upload.imagePath.startsWith(albumPath));
    }

    getUpload(imagePath: string): UploadEntry | undefined {
        return this.#uploads.find((upload) => upload.imagePath === imagePath);
    }

    addUpload(file: File, imagePath: string): void {
        this.#uploads.push({
            file,
            imagePath,
            status: UploadState.UPLOAD_NOT_STARTED,
        });
    }

    updateUploadState(imagePath: string, status: UploadState): void {
        const upload = this.#uploads.find((upload) => upload.imagePath === imagePath);
        if (upload) upload.status = status;

        // TODO: make this atomic, such as with the previous Immer-based implementation:
        // uploadStore.update((oldValue: UploadStore) =>
        //     produce(oldValue, (draftState: UploadStore) => {
        //         const upload = draftState.find((upload) => upload.imagePath === imagePath);
        //         if (upload) upload.status = status;
        //         return draftState;
        //     }),
        // );
    }

    markUploadAsProcessing(imagePath: string, versionId: string): void {
        const upload = this.#uploads.find((upload) => upload.imagePath === imagePath);
        if (upload) {
            upload.status = UploadState.PROCESSING;
            upload.versionId = versionId;
        }

        // TODO: make this atomic, such as with the previous Immer-based implementation:
        // uploadStore.update((oldValue: UploadStore) =>
        //     produce(oldValue, (draftState: UploadStore) => {
        //         const upload = draftState.find((upload) => upload.imagePath === imagePath);
        //         if (upload) {
        //             upload.status = UploadState.PROCESSING;
        //             upload.versionId = versionId;
        //         }
        //         return draftState;
        //     }),
        // );
    }

    removeUpload(imagePath: string): void {
        this.#uploads.filter((upload) => upload.imagePath !== imagePath);
    }
}
export const uploadStore = new AlbumUploadStore();
