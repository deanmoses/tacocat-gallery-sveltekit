<!--
  @component 
  
  Button to upload multiple images on a day album page
-->
<script lang="ts">
    import { page } from '$app/state';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';
    import { getSanitizedFiles, uploadMachine } from '$lib/state/admin/UploadMachine.svelte';
    import { isValidDayAlbumPath, validExtensionsString } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let albumPath = $derived(page.url.pathname + '/');
    let show = $derived(isValidDayAlbumPath(albumPath)); // Show this button only on day ablums

    let fileInput = $state() as HTMLInputElement;

    function onUploadButtonClick() {
        fileInput.click();
    }

    function onFilesSelected() {
        if (!fileInput.files) return;
        if (!isValidDayAlbumPath(albumPath)) throw new Error(`Invalid day album path: [${albumPath}]`);
        console.log(`I'll upload [${fileInput.files.length}] images to album [${albumPath}]`);
        const imagesToUpload = getSanitizedFiles(fileInput.files, albumPath);
        uploadMachine.uploadImages(albumPath, imagesToUpload);
    }
</script>

{#if show}
    <ControlStripButton onclick={onUploadButtonClick}><UploadIcon />Upload</ControlStripButton>
    <input
        bind:this={fileInput}
        onchange={onFilesSelected}
        type="file"
        multiple
        accept={validExtensionsString()}
        style="display:none"
    />
{/if}
