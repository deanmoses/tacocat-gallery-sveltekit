<!--
  @component Button to rename a day album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import RenameIcon from '$lib/components/site/icons/RenameIcon.svelte';
    import { renameDayAlbum } from '$lib/stores/AlbumRenameStore';
    import { albumStore } from '$lib/stores/AlbumStore';
    import {
        getNameFromPath,
        getParentFromPath,
        isValidDayAlbumPath,
        sanitizeDayAlbumName,
    } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../controls/buttons/ControlStripButton.svelte';
    import TextDialog from './TextDialog.svelte';

    let albumPath: string;
    $: albumPath = $page.url.pathname + '/';

    // Show this button only on day albums
    let show: boolean = false;
    $: show = isValidDayAlbumPath(albumPath);

    let dialog: TextDialog;

    function originalName(): string {
        const albumName = getNameFromPath(albumPath);
        if (!albumName) throw 'no albumName';
        return albumName;
    }

    function onButtonClick() {
        dialog.show();
    }

    async function onNewAlbumName(e: CustomEvent<{ value: string }>) {
        const newAlbumPath = albumNameToPath(e.detail.value);
        console.log(`Renaming [${albumPath}] to [${newAlbumPath}]`);
        await renameDayAlbum(albumPath, newAlbumPath);
        console.log(`Finished await of rename [${albumPath}] to [${newAlbumPath}]`);
        const parentPath = getParentFromPath(newAlbumPath);
        goto(parentPath);
    }

    async function validateDayAlbumName(albumName: string): Promise<string | undefined> {
        const newAlbumPath = albumNameToPath(albumName);
        if (!isValidDayAlbumPath(newAlbumPath)) return 'invalid album name';
        if (await albumStore.albumExists(newAlbumPath)) return 'already exists';
    }

    function albumNameToPath(albumName: string): string {
        return getParentFromPath(albumPath) + albumName + '/';
    }
</script>

{#if show}
    <ControlStripButton on:click={onButtonClick}><RenameIcon />Rename</ControlStripButton>
    <TextDialog
        label="New Album Name"
        bind:this={dialog}
        on:newValue={onNewAlbumName}
        sanitizor={sanitizeDayAlbumName}
        validator={validateDayAlbumName}
        initialValue={originalName()}
    />
{/if}
