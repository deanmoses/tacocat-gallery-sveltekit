<!--
  @component 
  
  Dialog to confirm overwriting files
-->
<script lang="ts">
    import Dialog from '../../Dialog.svelte';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';

    interface Props {
        /** Async callback to be called when the user confirms */
        onConfirm?: () => Promise<void>;
    }

    let { onConfirm }: Props = $props();

    let dialog: Dialog | undefined = $state();
    let filesAlreadyInAlbum: string[] = $state([]);
    // TODO delete below once I verify that the migrated code above works
    // $effect(() => {
    //     filesAlreadyInAlbum = filesAlreadyInAlbum;
    // });
    let filez = $derived(filesAlreadyInAlbum.join(', '));

    export function show(f: string[]): void {
        filesAlreadyInAlbum = f;
        dialog?.show();
    }

    async function onSubmit(e?: Event): Promise<void> {
        e?.preventDefault();
        dialog?.close();
        filesAlreadyInAlbum = [];
        if (onConfirm) {
            await onConfirm();
        }
    }

    function onCancelButtonClick(): void {
        dialog?.close();
        filesAlreadyInAlbum = [];
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
        Already in album: {filez}
    {/snippet}
    {#snippet buttons()}
        <button onclick={onCancelButtonClick}><CancelIcon /> Cancel</button>
        <button onclick={onSubmit}><UploadIcon /> Overwrite</button>
    {/snippet}
</Dialog>
