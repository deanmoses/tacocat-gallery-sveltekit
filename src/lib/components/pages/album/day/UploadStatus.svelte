<!--
  @component Widget that displays the status of the uploads
-->
<script lang="ts">
    import { UploadState, type UploadEntry } from '$lib/models/album';

    export let uploads: UploadEntry[] | undefined = undefined;
    let uploadingCount: number = 0;
    let processingCount: number = 0;
    $: uploadingCount = uploads
        ? uploads.reduce((acc, upload) => acc + (upload.status === UploadState.UPLOADING ? 1 : 0), 0)
        : 0;
    $: processingCount = uploads
        ? uploads.reduce((acc, upload) => acc + (upload.status === UploadState.PROCESSING ? 1 : 0), 0)
        : 0;
</script>

{#if uploadingCount}{uploadingCount} uploading <span>📤</span>{#if processingCount},{/if}{/if}
{#if processingCount}{processingCount} processing <span>🕒</span>{/if}

<style>
    span {
        filter: grayscale(100%);
    }
</style>
