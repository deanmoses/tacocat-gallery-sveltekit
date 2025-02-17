import { albumState } from '../AlbumState.svelte';
import { sessionStore } from '../SessionStore.svelte';

/**
 * Edit mode state machine
 */
class EditModeMachine {
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

    turnOnEditMode(): void {
        if (sessionStore.isAdmin) albumState.editMode = true;
    }

    turnOffEditMode(): void {
        albumState.editMode = false;
    }
}
export const editModeMachine = new EditModeMachine();
