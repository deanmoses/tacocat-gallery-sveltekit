<!--
  @component Button to rename image or album
-->
<script lang="ts">
    import { page } from '$app/stores';
    import RenameIcon from '$lib/components/site/icons/RenameIcon.svelte';
    import {
        getNameFromPath,
        getParentFromPath,
        isValidDayAlbumName,
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
        const newAlbumName = e.detail.value;
        const newAlbumPath = getParentFromPath(albumPath) + newAlbumName + '/';
        console.log(`I should rename this album to [${newAlbumPath}]`);
        // TODO
        // - call server rename
        // - goto(newPath);
        // - THEN somehow delete old album from AlbumStore - retrieve parent album?
    }

    function validateAlbumName(albumName: string): string | undefined {
        if (!isValidDayAlbumName(albumName)) return 'invalid album name';
    }
</script>

{#if show}
    <button on:click={onButtonClick}><RenameIcon />Rename</button>
    <TextDialog
        label="New Album Name"
        bind:this={dialog}
        on:newValue={onNewAlbumName}
        sanitizor={sanitizeDayAlbumName}
        validator={validateAlbumName}
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
