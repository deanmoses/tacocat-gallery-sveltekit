import { albumState } from '../AlbumState.svelte';
import { sessionStore } from '../SessionStore.svelte';

/**
 * Edit mode state machine
 */
class EditModeMachine {
    //
    // STATE TRANSITION METHODS
    // These mutate the state.
    //
    // Characteristics:
    //  - These are the ONLY way to update this state.
    //    These should be the only public methods on this state machine.
    //  - These ONLY update state.
    //    If they have to do any work, like making a server call, they invoke it in an
    //    event-like fire-and-forget fashion, meaning invoke async methods *without* await.
    //  - These are synchronous.
    //    They expectation is that they return near-instantly.
    //  - These return void.
    //    To read this state, use one of the public $derived() fields
    //

    turnOnEditMode(): void {
        if (sessionStore.isAdmin) albumState.editMode = true;
    }

    turnOffEditMode(): void {
        albumState.editMode = false;
    }
}
export const editModeMachine = new EditModeMachine();
