<!--
  @component Button to upload multiple images on a day album page
-->
<script lang="ts">
    import { page } from '$app/stores';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';
    import { upload } from '$lib/stores/admin/UploadStoreLogic';
    import { isValidDayAlbumPath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    $: albumPath = $page.url.pathname + '/';
    $: show = isValidDayAlbumPath(albumPath); // Show this button only on day ablums

    let fileInput: HTMLInputElement;

    async function onUploadButtonClick() {
        fileInput.click();
    }

    async function onFilesSelected() {
        upload(fileInput.files, albumPath);
    }
</script>

{#if show}
    <ControlStripButton on:click={onUploadButtonClick}><UploadIcon />Upload</ControlStripButton>
    <input
        bind:this={fileInput}
        on:change={onFilesSelected}
        type="file"
        multiple
        accept=".jpg, .jpeg"
        style="display:none"
    />
{/if}
