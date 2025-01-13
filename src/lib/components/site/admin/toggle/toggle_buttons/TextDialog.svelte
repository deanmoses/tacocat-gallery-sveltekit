<!--
  @component 
  
  Dialog to get a text input from user, such as a new album name 
-->
<script lang="ts">
    import Dialog from '../../Dialog.svelte';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';

    interface Props {
        label: string;
        initialValue: string;
        extension?: string;
        sanitizor: (n: string) => string;
        validator: (n: string) => Promise<string | undefined>;
        onNewValue: (n: string) => void;
    }

    let { label, initialValue, extension = '', sanitizor, validator, onNewValue }: Props = $props();
    let dialog = $state() as Dialog;
    let textfield = $state() as HTMLInputElement;
    let errorMsg: string | undefined = $state();

    export function show(): void {
        dialog.show();
    }

    function onTextChange(): void {
        if (textfield.value) {
            textfield.value = sanitizor(textfield.value);
        }
    }

    async function onSubmit(e: Event): Promise<void> {
        e.preventDefault();
        if (!validator) {
            console.log(`No validator function`);
            return;
        }
        if (textfield.value) {
            const validationErrorMsg = await validator(textfield.value);
            if (validationErrorMsg) {
                errorMsg = validationErrorMsg;
            } else {
                dialog.close();
                onNewValue(textfield.value);
            }
        }
    }

    function onCancelButtonClick(): void {
        dialog.close();
    }

    async function onkeydown(event: KeyboardEvent): Promise<void> {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                await onSubmit(event);
                break;
            // Prevent arrow keys from navigating to the prev/next photo or parent album
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'ArrowUp':
                event.stopPropagation();
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
        <button onclick={onSubmit}><SaveIcon /> Confirm</button>
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
