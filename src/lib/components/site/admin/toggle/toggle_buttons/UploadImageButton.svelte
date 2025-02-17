<!--
  @component 
  
  Button to upload a single image to replace existing image
-->
<script lang="ts">
    import { page } from '$app/state';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';
    import { uploadMachine } from '$lib/stores/admin/UploadMachine.svelte';
    import { isValidImagePath, validExtensionsString } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let imagePath = $derived(page.url.pathname);
    let show = $derived(isValidImagePath(page.url.pathname)); // Show this button only on image pages

    let fileInput = $state() as HTMLInputElement;

    async function onUploadButtonClick() {
        fileInput.click();
    }

    function onFileSelected() {
        const files = fileInput.files;
        if (!files || !files.length) return;
        // this error should never happen
        if (files.length > 1) throw new Error('Only one image can be uploaded at a time');
        uploadMachine.uploadImage(imagePath, files[0]);
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
