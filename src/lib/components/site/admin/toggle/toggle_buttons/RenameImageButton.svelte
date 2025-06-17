<!--
  @component 
  
  Button to rename an image
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import RenameIcon from '$lib/components/site/icons/RenameIcon.svelte';
    import {
        getNameFromPath,
        getParentFromPath,
        isValidImageNameWithoutExtensionStrict,
        isValidImagePath,
        sanitizeImageNameWithoutExtension,
    } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';
    import TextDialog from './TextDialog.svelte';
    import { imageRenameMachine } from '$lib/state/admin/ImageRenameMachine.svelte';
    import { albumState } from '$lib/state/AlbumState.svelte';

    let imagePath: string = $derived(page.url.pathname);
    let show: boolean = $derived(isValidImagePath(imagePath)); // Show this button only on images
    let dialog = $state() as TextDialog;

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

    function onNewImageName(newImageName: string) {
        const newImagePath = imageNameWithoutExtensionToPath(newImageName);
        imageRenameMachine.renameImage(imagePath, newImagePath);
        const albumPath = getParentFromPath(newImagePath);
        goto(albumPath);
    }

    async function validateImageName(newImageName: string): Promise<string | undefined> {
        if (!isValidImageNameWithoutExtensionStrict(newImageName)) return 'invalid image name';
        const newImagePath = imageNameWithoutExtensionToPath(newImageName);
        const albumPath = getParentFromPath(newImagePath);
        const album = albumState.albums.get(albumPath);
        if (!album || !album.album) return;
        const image = album.album.getImage(newImagePath);
        if (image) return 'image already exists';
    }

    function imageNameWithoutExtensionToPath(imageNameWithoutExtension: string): string {
        const newName = imageNameWithoutExtension + fileExtension();
        return getParentFromPath(imagePath) + newName;
    }
</script>

{#if show}
    <ControlStripButton onclick={onButtonClick} title="Change name on disk"><RenameIcon />Rename</ControlStripButton>
    <TextDialog
        label="New Image Name"
        bind:this={dialog}
        onNewValue={onNewImageName}
        sanitizor={sanitizeImageNameWithoutExtension}
        validator={validateImageName}
        initialValue={originalImageName()}
        extension={fileExtension()}
    />
{/if}
