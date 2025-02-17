import { toast } from '@zerodevx/svelte-toast';
import { UploadState } from '$lib/models/album';
import { globalStore } from '../GlobalStore.svelte';

/**
 * Image upload state machine
 */
class UploadMachine {
    //
    // STATE TRANSITION METHODS
    // These mutate the store's state.
    //
    // Characteristics:
    //  - These are the ONLY way to update this store's state.
    //    These should be the only public methods on this store.
    //  - These ONLY update state.
    //    If they have to do any work, like making a server call, they invoke it in an
    //    event-like fire-and-forget fashion, meaning invoke async methods *without* await.
    //  - These are synchronous.
    //    They expectation is that they return near-instantly.
    //  - These return void.
    //    To read this store's state, use one of the public $derived() fields
    //

    uploadEnqueued(imagePath: string, file: File): void {
        globalStore.uploads.push({
            file,
            imagePath,
            status: UploadState.UPLOAD_NOT_STARTED,
        });
    }

    uploadStarted(imagePath: string): void {
        const upload = globalStore.uploads.find((upload) => upload.imagePath === imagePath);
        if (upload) upload.status = UploadState.UPLOADING;
    }

    uploadProcessing(imagePath: string, versionId: string): void {
        const upload = globalStore.uploads.find((upload) => upload.imagePath === imagePath);
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

    uploadErrored(imagePath: string, errorMessage: string): void {
        console.error(`Error uploading [${imagePath}]: ${errorMessage}`);
        toast.push(`Error uploading [${imagePath}]`);
    }

    uploadComplete(imagePath: string): void {
        globalStore.uploads.filter((upload) => upload.imagePath !== imagePath);
    }
}
export const uploadMachine = new UploadMachine();
