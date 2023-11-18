<!--
  @component Dialog to get new album name from user
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let initialName: string;
    let dialog: HTMLDialogElement;
    let textfield: HTMLInputElement;

    export function show(): void {
        dialog.showModal();
    }

    export function onClose() {
        dispatch('close', {
            newName: textfield.value,
        });
    }
</script>

<dialog bind:this={dialog} on:close={onClose}>
    <form method="dialog">
        <p>
            <label>
                New Album Name
                <input bind:this={textfield} type="text" value={initialName} required />
            </label>
        </p>
        <menu>
            <button id="closeDialog" value="cancel">Cancel</button>
            <button id="confirmBtn" value="default">Confirm</button>
        </menu>
    </form>
</dialog>

<style>
    dialog::backdrop {
        background-image: linear-gradient(45deg, magenta, rebeccapurple, dodgerblue, green);
        opacity: 0.75;
    }

    dialog {
        border: none;
        box-shadow: #00000029 2px 2px 5px 2px;
        border-radius: 10px;
        padding: 30px;
        background-color: pink;
        font-family: sans-serif;
        font-size: 20px;
        font-weight: bold;

        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
</style>
