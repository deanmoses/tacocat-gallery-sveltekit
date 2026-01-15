<!--
  @component 
  
  Button to upload a single image to replace existing image
-->
<script lang="ts">
    import { page } from '$app/state';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';
    import { uploadMachine } from '$lib/stores/admin/UploadMachine.svelte';
    import { getParentFromPath, isValidImagePath, validExtensionsString } from '$lib/utils/galleryPathUtils';
    import { getUploadPathForReplacement } from '$lib/utils/uploadUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let imagePath = $derived(page.url.pathname);
    let show = $derived(isValidImagePath(page.url.pathname)); // Show this button only on image pages
    let albumPath = $derived(getParentFromPath(imagePath));
    let image = $derived(albumState.albums.get(albumPath)?.album?.getImage(imagePath));

    let fileInput = $state() as HTMLInputElement;

    async function onUploadButtonClick() {
        fileInput.click();
    }

    function onFileSelected() {
        const files = fileInput.files;
        if (!files || !files.length) return;
        // this error should never happen
        if (files.length > 1) throw new Error('Only one image can be uploaded at a time');
        const uploadPath = getUploadPathForReplacement(imagePath, files[0].name);
        uploadMachine.uploadImage(uploadPath, files[0], image?.versionId);
    }
</script>

{#if show}
    <ControlStripButton onclick={onUploadButtonClick} title="Upload new version of image"
        ><UploadIcon />Replace</ControlStripButton
    >
    <input
        bind:this={fileInput}
        onchange={onFileSelected}
        type="file"
        id="fileInput"
        accept={validExtensionsString()}
        style="display:none"
    />
{/if}
