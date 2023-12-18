<!--
  @component Button to upload a single image to replace existing image
-->
<script lang="ts">
    import { page } from '$app/stores';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';
    import { uploadSingleImage } from '$lib/stores/admin/UploadStoreLogic';
    import { isValidImagePath, validExtensionsString } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    $: imagePath = $page.url.pathname;
    $: show = isValidImagePath($page.url.pathname); // Show this button only on image pages

    let fileInput: HTMLInputElement;

    async function onUploadButtonClick() {
        fileInput.click();
    }

    async function onFileSelected() {
        const files = fileInput.files;
        if (!files || !files.length) return;
        // this error should never happen
        if (files.length > 1) throw new Error('Only one image can be uploaded at a time');
        await uploadSingleImage(files[0], imagePath);
    }
</script>

{#if show}
    <ControlStripButton on:click={onUploadButtonClick} title="Upload new version of image"
        ><UploadIcon />Replace</ControlStripButton
    >
    <input
        bind:this={fileInput}
        on:change={onFileSelected}
        type="file"
        id="fileInput"
        accept={validExtensionsString()}
        style="display:none"
    />
{/if}
