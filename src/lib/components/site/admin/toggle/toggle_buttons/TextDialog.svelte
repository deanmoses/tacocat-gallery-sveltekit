<!--
  @component Dialog to get a text input from user, such as a new album name 
-->
<script lang="ts">
    import { preventDefault } from 'svelte/legacy';

    import { createEventDispatcher } from 'svelte';
    import Dialog from '../../Dialog.svelte';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';

    const dispatch = createEventDispatcher();

    interface Props {
        label: string;
        initialValue: string;
        extension?: string;
        sanitizor: (n: string) => string;
        validator: (n: string) => Promise<string | undefined>;
    }

    let { label, initialValue, extension = '', sanitizor, validator }: Props = $props();
    let dialog: Dialog = $state();
    let textfield: HTMLInputElement = $state();
    let errorMsg: string = $state();

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

    async function onkeydown(event: KeyboardEvent): Promise<void> {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                await onSubmit();
        }
    }
</script>

<Dialog bind:this={dialog} {onkeydown}>
    {#snippet content()}
        <label>
            <div class="label">{label}</div>
            <input
                type="text"
                name="text"
                bind:this={textfield}
                value={initialValue}
                oninput={onTextChange}
                required
            />{extension}
            {#if errorMsg}
                <div class="errorMsg">{errorMsg}</div>
            {/if}
        </label>
    {/snippet}
    {#snippet buttons()}
        <button onclick={onCancelButtonClick}><CancelIcon /> Cancel</button>
        <button onclick={preventDefault(onSubmit)}><SaveIcon /> Confirm</button>
    {/snippet}
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
