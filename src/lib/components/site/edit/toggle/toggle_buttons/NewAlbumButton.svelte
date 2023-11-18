<!--
  @component Button to create new album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { isValidDayAlbumName, isValidYearAlbumPath, sanitizeDayAlbumName } from '$lib/utils/galleryPathUtils';
    import TextDialog from './TextDialog.svelte';

    let albumPath: string;
    $: albumPath = $page.url.pathname + '/';

    let show: boolean = false;
    $: show = isValidYearAlbumPath(albumPath); // Show this button only on year ablums

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
        const newAlbumName = e.detail.value;
        const newAlbumPath = albumPath + newAlbumName + '/';
        await albumStore.createAlbum(newAlbumPath);
        goto(newAlbumPath);
    }

    function validateAlbumName(albumName: string): string | undefined {
        if (!isValidDayAlbumName(albumName)) return 'invalid album name';
    }
</script>

{#if show}
    <button on:click={onButtonClick}><SaveIcon />New Album</button>
    <TextDialog
        label="New Album Name"
        bind:this={dialog}
        on:newValue={onNewAlbumName}
        sanitizor={sanitizeDayAlbumName}
        validator={validateAlbumName}
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
