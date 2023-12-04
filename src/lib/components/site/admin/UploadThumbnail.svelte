<!--
  @component A thumbnail of an uploading image
-->
<script lang="ts">
    import type { UploadEntry } from '$lib/models/album';
    import Thumbnail from '../Thumbnail.svelte';
    import WaitingIcon from '../icons/WaitingIcon.svelte';

    export let upload: UploadEntry;
    let url = URL.createObjectURL(upload.file);

    function onLoad() {
        if (url) {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.log(`Error revoking URL [${url}]:`, e);
            }
        }
    }
</script>

<Thumbnail title={upload.file.name} src={url} summary={upload.status} on:load={onLoad}>
    <svelte:fragment slot="selectionControls">
        <div><WaitingIcon height="100px" width="100px" /></div>
    </svelte:fragment>
</Thumbnail>

<style>
    div {
        height: var(--thumbnail-height);
        width: var(--thumbnail-width);
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
