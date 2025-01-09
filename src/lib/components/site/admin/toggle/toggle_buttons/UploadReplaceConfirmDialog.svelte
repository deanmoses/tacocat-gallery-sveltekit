<!--
  @component Dialog to confirm overwriting files
-->
<script lang="ts">
  import { run, preventDefault } from 'svelte/legacy';

    import { createEventDispatcher } from 'svelte';
    import Dialog from '../../Dialog.svelte';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';

    const dispatch = createEventDispatcher();

    let dialog: Dialog = $state();
    let filesAlreadyInAlbum: string[] = $state([]);
    run(() => {
    filesAlreadyInAlbum = filesAlreadyInAlbum;
  });
    let filez = $derived(filesAlreadyInAlbum.join(', '));

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
    {#snippet content()}
    Already in album: {filez}
  {/snippet}
    {#snippet buttons()}
  
          <button onclick={onCancelButtonClick}><CancelIcon /> Cancel</button>
          <button onclick={preventDefault(onSubmit)}><UploadIcon /> Overwrite</button>
      
  {/snippet}
</Dialog>
