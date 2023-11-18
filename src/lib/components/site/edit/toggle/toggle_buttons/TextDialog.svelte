<!--
  @component Dialog to get a text input from user, such as a new album name 
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let label: string;
    export let initialValue: string;
    export let sanitizor: Function; // TODO: more specific type with function signature
    export let validator: Function; // TODO: more specific type with function signature
    let dialog: HTMLDialogElement;
    let textfield: HTMLInputElement;
    let errorMsg: string;

    export function show(): void {
        dialog.showModal();
    }

    function onTextChange() {
        textfield.value = sanitizor(textfield.value);
    }

    function onConfirmButtonClick() {
        if (!validator) {
            console.log(`No validator function`);
            return;
        }
        const validationErrorMsg = validator(textfield.value);
        if (validationErrorMsg) {
            console.log(`Got a validation error message: [${validationErrorMsg}]`);
            errorMsg = validationErrorMsg;
        } else {
            dialog.close();
            dispatch('newValue', {
                value: textfield.value,
            });
        }
    }

    function onCancelButtonClick() {
        dialog.close();
    }
</script>

<dialog bind:this={dialog}>
    <form method="dialog">
        <p>
            <label>
                <div>{label}</div>
                <input type="text" bind:this={textfield} value={initialValue} on:input={onTextChange} required />
                {#if errorMsg}
                    <div class="errorMsg">{errorMsg}</div>
                {/if}
            </label>
        </p>
        <menu>
            <button on:click={onCancelButtonClick}>Cancel</button>
            <button on:click|preventDefault={onConfirmButtonClick}>Confirm</button>
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
        border-radius: 8px;
        padding: 0.5em;
        background-color: rgb(143, 143, 143);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .errorMsg {
        font-style: italic;
        color: rgb(58, 59, 59);
    }
</style>
