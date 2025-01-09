<!--
  @component Widget that displays the status of the uploads
-->
<script lang="ts">
  import { run } from 'svelte/legacy';

    import { UploadState, type UploadEntry } from '$lib/models/album';

  interface Props {
    uploads?: UploadEntry[] | undefined;
  }

  let { uploads = undefined }: Props = $props();
    let uploadingCount: number = $state(0);
    let processingCount: number = $state(0);
    run(() => {
    uploadingCount = uploads
          ? uploads.reduce((acc, upload) => acc + (upload.status === UploadState.UPLOADING ? 1 : 0), 0)
          : 0;
  });
    run(() => {
    processingCount = uploads
          ? uploads.reduce((acc, upload) => acc + (upload.status === UploadState.PROCESSING ? 1 : 0), 0)
          : 0;
  });
</script>

{#if uploadingCount}{uploadingCount} uploading <span>📤</span>{#if processingCount},{/if}{/if}
{#if processingCount}{processingCount} processing <span>🕒</span>{/if}

<style>
    span {
        filter: grayscale(100%);
    }
</style>
