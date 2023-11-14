<!--
  @component Button to upload files
-->
<script lang="ts">
    import { page } from '$app/stores';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';
    import { isValidDayAlbumPath } from '$lib/utils/galleryPathUtils';

    // Show this button only on day ablums
    let show: boolean = false;
    $: show = isValidDayAlbumPath($page.url.pathname + '/');

    async function onUploadButtonClick() {
        document.getElementById('fileInput')?.click();
    }

    async function onFilesSelected() {
        const files = (<HTMLInputElement>document.getElementById('fileInput'))?.files;
        const fileCount: number = files?.length ?? 0;
        alert(`I should upload these ${fileCount} files`);
    }
</script>

{#if show}
    <button on:click|once={onUploadButtonClick}><UploadIcon />Upload</button>
    <input
        on:change|once={onFilesSelected}
        type="file"
        id="fileInput"
        multiple
        accept=".jpg, .jpeg"
        style="display:none"
    />
{/if}

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
