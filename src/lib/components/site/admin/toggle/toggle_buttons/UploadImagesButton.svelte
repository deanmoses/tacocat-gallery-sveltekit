<!--
  @component Button to upload multiple images on a day album page
-->
<script lang="ts">
    import { page } from '$app/stores';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';
    import { upload } from '$lib/stores/admin/UploadStoreLogic';
    import { isValidDayAlbumPath, validExtensionsString } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let albumPath = $derived($page.url.pathname + '/');
    let show = $derived(isValidDayAlbumPath(albumPath)); // Show this button only on day ablums

    let fileInput: HTMLInputElement = $state();

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
        onchange={onFilesSelected}
        type="file"
        multiple
        accept={validExtensionsString()}
        style="display:none"
    />
{/if}
