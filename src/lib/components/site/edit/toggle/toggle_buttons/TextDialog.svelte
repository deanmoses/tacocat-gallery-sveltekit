<!--
  @component Dialog to get a text input from user, such as a new album name 
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let label: string;
    export let initialValue: string;
    let dialog: HTMLDialogElement;
    let textfield: HTMLInputElement;

    export function show(): void {
        dialog.showModal();
    }

    export function onConfirmButtonClick() {
        dialog.close();
        dispatch('newValue', {
            value: textfield.value,
        });
    }

    function onCancelButtonClick() {
        dialog.close();
    }
</script>

<dialog bind:this={dialog}>
    <form method="dialog">
        <p>
            <label>
                {label}
                <input bind:this={textfield} type="text" value={initialValue} required />
            </label>
        </p>
        <menu>
            <button on:click={onCancelButtonClick}>Cancel</button>
            <button on:click={onConfirmButtonClick}>Confirm</button>
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
