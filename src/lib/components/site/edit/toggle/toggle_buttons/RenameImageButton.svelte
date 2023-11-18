<!--
  @component Button to rename image
-->
<script lang="ts">
    import { page } from '$app/stores';
    import RenameIcon from '$lib/components/site/icons/RenameIcon.svelte';
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
        const newNameWithoutExtension = e.detail.value;
        const newName = newNameWithoutExtension + '.jpg';
        const newPath = getParentFromPath(imagePath) + newName;
        console.log(`I should rename this album to [${newPath}]`);
        // TODO
        // - call server rename
        // - goto(newPath);
        // - THEN somehow delete old album from AlbumStore - retrieve parent album?
    }

    function validateImageName(imageName: string): string | undefined {
        if (!isValidImageNameWithoutExtenstionStrict(imageName)) return 'invalid image name';
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
