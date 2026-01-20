<!--
  @component

  Button to rename a media item (image or video)
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import RenameIcon from '$lib/components/site/icons/RenameIcon.svelte';
    import {
        getNameFromPath,
        getParentFromPath,
        isValidMediaNameWithoutExtensionStrict,
        isValidMediaPath,
        sanitizeMediaNameWithoutExtension,
    } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';
    import TextDialog from './TextDialog.svelte';
    import { mediaRenameMachine } from '$lib/stores/admin/MediaRenameMachine.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

    let mediaPath: string = $derived(page.url.pathname);
    let show: boolean = $derived(isValidMediaPath(mediaPath)); // Show this button on media (images and videos)
    let dialog = $state() as TextDialog;

    function originalMediaName(): string {
        const mediaName = getNameFromPath(mediaPath);
        if (!mediaName) throw 'no mediaName';
        const mediaNameWithoutExtension = mediaName.split('.')[0];
        return mediaNameWithoutExtension;
    }

    function fileExtension(): string {
        const mediaName = getNameFromPath(mediaPath);
        if (!mediaName) throw 'no mediaName';
        const extension = '.' + mediaName.split('.')[1];
        return extension;
    }

    function onButtonClick() {
        dialog.show();
    }

    function onNewMediaName(newMediaName: string) {
        const newMediaPath = mediaNameWithoutExtensionToPath(newMediaName);
        mediaRenameMachine.renameMediaItem(mediaPath, newMediaPath);
        const albumPath = getParentFromPath(newMediaPath);
        goto(albumPath);
    }

    async function validateMediaName(newMediaName: string): Promise<string | undefined> {
        if (!isValidMediaNameWithoutExtensionStrict(newMediaName)) return 'invalid filename';
        const newMediaPath = mediaNameWithoutExtensionToPath(newMediaName);
        const albumPath = getParentFromPath(newMediaPath);
        const album = albumState.albums.get(albumPath);
        if (!album || !album.album) return;
        const media = album.album.getMedia(newMediaPath);
        if (media) return 'file already exists';
    }

    function mediaNameWithoutExtensionToPath(mediaNameWithoutExtension: string): string {
        const newName = mediaNameWithoutExtension + fileExtension();
        return getParentFromPath(mediaPath) + newName;
    }
</script>

{#if show}
    <ControlStripButton onclick={onButtonClick} title="Change name on disk"><RenameIcon />Rename</ControlStripButton>
    <TextDialog
        label="New Filename"
        bind:this={dialog}
        onNewValue={onNewMediaName}
        sanitizor={sanitizeMediaNameWithoutExtension}
        validator={validateMediaName}
        initialValue={originalMediaName()}
        extension={fileExtension()}
    />
{/if}
