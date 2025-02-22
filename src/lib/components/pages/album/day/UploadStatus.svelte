<!--
  @component 
  
  Widget that displays the status of the uploads
-->
<script lang="ts">
    import { ImageStatus, type ImageEntry } from '$lib/models/album';

    interface Props {
        uploads?: ImageEntry[];
    }
    let { uploads = undefined }: Props = $props();
    let uploadingCount: number = $derived(
        uploads?.reduce((acc, upload) => acc + (ImageStatus.UPLOAD_TRANSFERRING === upload.status ? 1 : 0), 0) ?? 0,
    );
    let processingCount: number = $derived(
        uploads?.reduce((acc, upload) => acc + (ImageStatus.UPLOAD_PROCESSING === upload.status ? 1 : 0), 0) ?? 0,
    );
</script>

{#if uploadingCount}{uploadingCount} uploading <span>📤</span>{#if processingCount},{/if}{/if}
{#if processingCount}{processingCount} processing <span>🕒</span>{/if}

<style>
    span {
        filter: grayscale(100%);
    }
</style>
