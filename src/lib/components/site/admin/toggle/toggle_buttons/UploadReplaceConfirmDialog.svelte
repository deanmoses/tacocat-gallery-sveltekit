<!--
  @component Dialog to confirm overwriting files
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Dialog from '../../Dialog.svelte';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';

    const dispatch = createEventDispatcher();

    let dialog: Dialog;
    let filesAlreadyInAlbum: string[] = [];
    $: filesAlreadyInAlbum = filesAlreadyInAlbum;
    $: filez = filesAlreadyInAlbum.join(', ');

    export function show(f: string[]): void {
        filesAlreadyInAlbum = f;
        dialog.show();
    }

    async function onSubmit(): Promise<void> {
        dialog.close();
        filesAlreadyInAlbum = [];
        dispatch('confirm', {
            value: true,
        });
    }

    function onCancelButtonClick(): void {
        dialog.close();
        filesAlreadyInAlbum = [];
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
    <svelte:fragment slot="content">Already in album: {filez}</svelte:fragment>
    <svelte:fragment slot="buttons">
        <button on:click={onCancelButtonClick}><CancelIcon /> Cancel</button>
        <button on:click|preventDefault={onSubmit}><UploadIcon /> Overwrite</button>
    </svelte:fragment>
</Dialog>
