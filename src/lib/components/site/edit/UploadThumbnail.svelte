<!--
  @component A thumbnail of an uploading image
-->
<script lang="ts">
    import type { UploadEntry } from '$lib/stores/UploadStore';
    import Thumbnail from '../Thumbnail.svelte';

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

<Thumbnail title={upload.file.name} src={url} summary={upload.status} on:load={onLoad} />
