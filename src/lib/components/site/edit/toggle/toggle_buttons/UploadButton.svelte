<!--
  @component Button to upload files
-->
<script lang="ts">
    import { page } from '$app/stores';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';
    import { upload } from '$lib/stores/UploadStore';
    import { isValidDayAlbumPath } from '$lib/utils/galleryPathUtils';

    let path: string;
    $: path = $page.url.pathname;

    // Show this button only on day ablums
    let show: boolean = false;
    $: show = isValidDayAlbumPath($page.url.pathname + '/');

    async function onUploadButtonClick() {
        document.getElementById('fileInput')?.click();
    }

    async function onFilesSelected() {
        const files = (<HTMLInputElement>document.getElementById('fileInput'))?.files;
        if (!!files && !!files.length) {
            const albumPath = path + '/';
            await upload(files, albumPath);
        }
    }
</script>

{#if show}
    <button on:click={onUploadButtonClick}><UploadIcon />Upload</button>
    <input on:change={onFilesSelected} type="file" id="fileInput" multiple accept=".jpg, .jpeg" style="display:none" />
{/if}

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
