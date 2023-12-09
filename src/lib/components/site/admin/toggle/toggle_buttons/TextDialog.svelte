<!--
  @component Dialog to get a text input from user, such as a new album name 
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Dialog from '../../Dialog.svelte';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';

    const dispatch = createEventDispatcher();

    export let label: string;
    export let initialValue: string;
    export let extension: string = '';
    export let sanitizor: (n: string) => string;
    export let validator: (n: string) => Promise<string | undefined>;
    let dialog: Dialog;
    let textfield: HTMLInputElement;
    let errorMsg: string;

    export function show(): void {
        dialog.show();
    }

    function onTextChange(): void {
        textfield.value = sanitizor(textfield.value);
    }

    async function onSubmit(): Promise<void> {
        if (!validator) {
            console.log(`No validator function`);
            return;
        }
        const validationErrorMsg = await validator(textfield.value);
        if (validationErrorMsg) {
            errorMsg = validationErrorMsg;
        } else {
            dialog.close();
            dispatch('newValue', {
                value: textfield.value,
            });
        }
    }

    function onCancelButtonClick(): void {
        dialog.close();
    }

    async function onKeyPress(event: KeyboardEvent): Promise<void> {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                await onSubmit();
        }
    }
</script>

<Dialog bind:this={dialog} on:keydown={onKeyPress}>
    <svelte:fragment slot="content">
        <label>
            <div class="label">{label}</div>
            <input
                type="text"
                name="text"
                bind:this={textfield}
                value={initialValue}
                on:input={onTextChange}
                required
            />{extension}
            {#if errorMsg}
                <div class="errorMsg">{errorMsg}</div>
            {/if}
        </label>
    </svelte:fragment>
    <svelte:fragment slot="buttons">
        <button on:click={onCancelButtonClick}><CancelIcon /> Cancel</button>
        <button on:click|preventDefault={onSubmit}><SaveIcon /> Confirm</button>
    </svelte:fragment>
</Dialog>

<style>
    .label {
        margin-bottom: 0.3em;
    }

    .errorMsg {
        font-style: italic;
        color: rgb(58, 59, 59);
    }
</style>
