<!--
  @component 
  
  A thumbnail of an uploading image
-->
<script lang="ts">
    import type { ImageEntry, UploadEntry } from '$lib/models/album';
    import Thumbnail from '../Thumbnail.svelte';
    import WaitingIcon from '../icons/WaitingIcon.svelte';

    interface Props {
        imageEntry: ImageEntry;
    }
    let { imageEntry }: Props = $props();
    let upload: UploadEntry | undefined = $derived(imageEntry.upload);
    let url: string = $derived(upload ? URL.createObjectURL(upload.file) : '');
</script>

<Thumbnail title={upload?.file.name} src={url} summary={imageEntry.status}>
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
