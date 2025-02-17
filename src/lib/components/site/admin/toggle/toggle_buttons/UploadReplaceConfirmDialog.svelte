<!--
  @component 
  
  Dialog to confirm overwriting files
-->
<script lang="ts">
    import Dialog from '../../Dialog.svelte';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';

    interface Props {
        /** Callback to be called when the user confirms */
        onConfirm?: () => void;
    }

    let { onConfirm }: Props = $props();

    let dialog = $state() as Dialog;
    let filesAlreadyInAlbum: string[] = $state([]);
    let filez = $derived(filesAlreadyInAlbum.join(', '));

    export function show(f: string[]): void {
        filesAlreadyInAlbum = f;
        dialog?.show();
    }

    function onSubmit(e?: Event): void {
        e?.preventDefault();
        dialog.close();
        filesAlreadyInAlbum = [];
        if (onConfirm) onConfirm();
    }

    function onCancelButtonClick(): void {
        dialog.close();
        filesAlreadyInAlbum = [];
    }

    function onkeydown(event: KeyboardEvent): void {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                onSubmit();
        }
    }
</script>

<Dialog bind:this={dialog} {onkeydown}>
    {#snippet content()}
        Already in album: {filez}
    {/snippet}
    {#snippet buttons()}
        <button onclick={onCancelButtonClick}><CancelIcon /> Cancel</button>
        <button onclick={onSubmit}><UploadIcon /> Overwrite</button>
    {/snippet}
</Dialog>
