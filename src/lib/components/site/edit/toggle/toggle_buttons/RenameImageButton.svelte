<!--
  @component Button to rename image
-->
<script lang="ts">
    import { page } from '$app/stores';
    import RenameIcon from '$lib/components/site/icons/RenameIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import {
        getNameFromPath,
        getParentFromPath,
        isValidImageNameWithoutExtenstionStrict,
        isValidImagePath,
        sanitizeImageNameWithoutExtension,
    } from '$lib/utils/galleryPathUtils';
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

    function onButtonClick() {
        dialog.show();
    }

    async function onNewImageName(e: CustomEvent<{ value: string }>) {
        const newImagePath = imageNameWithoutExtensionToPath(e.detail.value);
        console.log(`I should rename this image to [${newImagePath}]`);
        // TODO
        // - call server rename
        // - goto(newImagePath);
        // - THEN somehow delete old album from AlbumStore - retrieve parent album?
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
    <button on:click={onButtonClick}><RenameIcon />Rename</button>
    <TextDialog
        label="New Image Name"
        bind:this={dialog}
        on:newValue={onNewImageName}
        sanitizor={sanitizeImageNameWithoutExtension}
        validator={validateImageName}
        initialValue={originalImageName()}
    />
{/if}

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
