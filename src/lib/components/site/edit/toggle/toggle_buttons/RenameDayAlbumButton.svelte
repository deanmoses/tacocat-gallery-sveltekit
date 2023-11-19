<!--
  @component Button to rename image or album
-->
<script lang="ts">
    import { page } from '$app/stores';
    import RenameIcon from '$lib/components/site/icons/RenameIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import {
        getNameFromPath,
        getParentFromPath,
        isValidDayAlbumPath,
        sanitizeDayAlbumName,
    } from '$lib/utils/galleryPathUtils';
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
        console.log(`I should rename this album to [${newAlbumPath}]`);
        // TODO
        // - call server rename
        // - goto(newPath);
        // - THEN somehow delete old album from AlbumStore - retrieve parent album?
    }

    async function validateDayAlbumName(albumName: string): Promise<string | undefined> {
        const newAlbumPath = albumNameToPath(albumName);
        console.log(`New Day album path: `, newAlbumPath);
        if (!isValidDayAlbumPath(newAlbumPath)) return 'invalid album name';
        if (await albumStore.albumExists(newAlbumPath)) return 'already exists';
    }

    function albumNameToPath(albumName: string): string {
        return getParentFromPath(albumPath) + albumName + '/';
    }
</script>

{#if show}
    <button on:click={onButtonClick}><RenameIcon />Rename</button>
    <TextDialog
        label="New Album Name"
        bind:this={dialog}
        on:newValue={onNewAlbumName}
        sanitizor={sanitizeDayAlbumName}
        validator={validateDayAlbumName}
        initialValue={originalName()}
    />
{/if}

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
