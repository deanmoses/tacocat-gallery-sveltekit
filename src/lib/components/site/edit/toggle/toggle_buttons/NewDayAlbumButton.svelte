<!--
  @component Button to create new album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { isValidDayAlbumPath, isValidYearAlbumPath, sanitizeDayAlbumName } from '$lib/utils/galleryPathUtils';
    import TextDialog from './TextDialog.svelte';

    let albumPath: string;
    $: albumPath = $page.url.pathname + '/';

    let show: boolean = false;
    $: show = isValidYearAlbumPath(albumPath); // Show this button only on year albums

    let dialog: TextDialog;

    function todayAlbumName(): string {
        const d = new Date();
        const month = ('0' + (d.getMonth() + 1)).slice(-2);
        const day = ('0' + d.getDate()).slice(-2);
        const month_day = `${month}-${day}`;
        return month_day;
    }

    function onButtonClick() {
        dialog.show();
    }

    async function onNewAlbumName(e: CustomEvent<{ value: string }>) {
        const newAlbumPath = albumNameToPath(e.detail.value);
        await albumStore.createAlbum(newAlbumPath);
        goto(newAlbumPath);
    }

    async function validateDayAlbumName(albumName: string): Promise<string | undefined> {
        const newAlbumPath = albumNameToPath(albumName);
        if (!isValidDayAlbumPath(newAlbumPath)) return 'invalid album name';
        if (await albumStore.albumExists(newAlbumPath)) return 'already exists';
    }

    function albumNameToPath(albumName: string): string {
        return albumPath + albumName + '/';
    }
</script>

{#if show}
    <button on:click={onButtonClick}><SaveIcon />New Album</button>
    <TextDialog
        label="New Album Name"
        bind:this={dialog}
        on:newValue={onNewAlbumName}
        sanitizor={sanitizeDayAlbumName}
        validator={validateDayAlbumName}
        initialValue={todayAlbumName()}
    />
{/if}

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
