<!--
  @component 
  
  A thumbnail of an uploading image
-->
<script lang="ts">
    import type { UploadEntry } from '$lib/models/album';
    import Thumbnail from '../Thumbnail.svelte';
    import WaitingIcon from '../icons/WaitingIcon.svelte';

    interface Props {
        upload: UploadEntry;
    }

    let { upload }: Props = $props();

    // Create object URL that tracks upload.file changes and cleans up properly
    let urlForTemplate = $state('');
    $effect(() => {
        const url = URL.createObjectURL(upload.file);
        urlForTemplate = url;
        return () => {
            console.info(`UploadThumbnail: revoking object URL for ${upload.file.name}`);
            URL.revokeObjectURL(url);
        };
    });
</script>

<Thumbnail title={upload.file.name} src={urlForTemplate} summary={upload.status}>
    {#snippet selectionControls()}
        <div><WaitingIcon height="100px" width="100px" /></div>
    {/snippet}
</Thumbnail>

<style>
    div {
        height: var(--thumbnail-height);
        width: var(--thumbnail-width);
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.5);
    }
</style>
