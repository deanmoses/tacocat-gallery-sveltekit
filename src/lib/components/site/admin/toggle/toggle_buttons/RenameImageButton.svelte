<!--
  @component Button to rename an image
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import RenameIcon from '$lib/components/site/icons/RenameIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { renameImage } from '$lib/stores/admin/ImageRenameStoreLogic';
    import {
        getNameFromPath,
        getParentFromPath,
        isValidImageNameWithoutExtenstionStrict,
        isValidImagePath,
        sanitizeImageNameWithoutExtension,
    } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';
    import TextDialog from './TextDialog.svelte';

    let imagePath: string;
    $: imagePath = $page.url.pathname;

    // Show this button only on images
    let show: boolean = false;
    $: show = isValidImagePath(imagePath);

    let dialog: TextDialog;

    function originalImageName(): string {
        const imageName = getNameFromPath(imagePath);
        if (!imageName) throw 'no imageName';
        const imageNameWithoutExtension = imageName.split('.')[0];
        return imageNameWithoutExtension;
    }

    function fileExtension(): string {
        const imageName = getNameFromPath(imagePath);
        if (!imageName) throw 'no imageName';
        const extension = '.' + imageName.split('.')[1];
        return extension;
    }

    function onButtonClick() {
        dialog.show();
    }

    async function onNewImageName(e: CustomEvent<{ value: string }>) {
        const newImagePath = imageNameWithoutExtensionToPath(e.detail.value);
        await renameImage(imagePath, newImagePath);
        goto(newImagePath);
    }

    async function validateImageName(newImageName: string): Promise<string | undefined> {
        if (!isValidImageNameWithoutExtenstionStrict(newImageName)) return 'invalid image name';
        const newImagePath = imageNameWithoutExtensionToPath(newImageName);
        const albumPath = getParentFromPath(newImagePath);
        const album = albumStore.getFromInMemory(albumPath);
        if (!album || !album.album) return;
        const image = album.album.getImage(newImagePath);
        if (image) return 'image already exists';
    }

    function imageNameWithoutExtensionToPath(imageNameWithoutExtension: string): string {
        const newName = imageNameWithoutExtension + '.jpg';
        return getParentFromPath(imagePath) + newName;
    }
</script>

{#if show}
    <ControlStripButton on:click={onButtonClick}><RenameIcon />Rename</ControlStripButton>
    <TextDialog
        label="New Image Name"
        bind:this={dialog}
        on:newValue={onNewImageName}
        sanitizor={sanitizeImageNameWithoutExtension}
        validator={validateImageName}
        initialValue={originalImageName()}
        extension={fileExtension()}
    />
{/if}
