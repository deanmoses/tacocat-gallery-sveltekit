<!--
  @component 
  
  Button to rename an image
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import RenameIcon from '$lib/components/site/icons/RenameIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { renameImage } from '$lib/stores/admin/ImageRenameStoreLogic';
    import {
        getNameFromPath,
        getParentFromPath,
        isValidImageNameWithoutExtensionStrict,
        isValidImagePath,
        sanitizeImageNameWithoutExtension,
    } from '$lib/utils/galleryPathUtils';
    import { toast } from '@zerodevx/svelte-toast';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';
    import TextDialog from './TextDialog.svelte';

    let imagePath: string = $derived(page.url.pathname);
    let show: boolean = $derived(isValidImagePath(imagePath)); // Show this button only on images
    let dialog: TextDialog | undefined = $state();

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
        dialog?.show();
    }

    async function onNewImageName(newImageName: string) {
        const newImagePath = imageNameWithoutExtensionToPath(newImageName);
        try {
            await renameImage(imagePath, newImagePath);
            goto(newImagePath);
        } catch (e) {
            toast.push(`Error renaming image: ${e}`);
        }
    }

    async function validateImageName(newImageName: string): Promise<string | undefined> {
        if (!isValidImageNameWithoutExtensionStrict(newImageName)) return 'invalid image name';
        const newImagePath = imageNameWithoutExtensionToPath(newImageName);
        const albumPath = getParentFromPath(newImagePath);
        const album = albumStore.getFromInMemory(albumPath);
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
