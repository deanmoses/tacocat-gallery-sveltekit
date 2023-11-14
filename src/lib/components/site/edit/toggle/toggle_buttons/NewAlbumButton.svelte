<!--
  @component Button to create a new album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { isValidAlbumPath, isValidImagePath, isValidYearAlbumPath } from '$lib/utils/galleryPathUtils';

    let path: string;
    $: path = $page.url.pathname;

    // Show this button only on year ablums
    let show: boolean = false;
    $: show = isValidYearAlbumPath($page.url.pathname + '/');

    async function onNewButtonClick() {
        let thePath = path;
        if (!isValidImagePath(thePath)) {
            thePath = thePath + '/';
            if (!isValidAlbumPath(thePath)) throw new Error(`Invalid path [${thePath}]`);
        }
        const d = new Date();
        const month = ('0' + (d.getMonth() + 1)).slice(-2);
        const day = ('0' + d.getDate()).slice(-2);
        const month_day = `${month}-${day}`;
        const newAlbumName = prompt('Date of new album ', month_day);
        const newAlbumPath = thePath + newAlbumName + '/';
        await albumStore.createAlbum(newAlbumPath);
        goto(newAlbumPath);
    }
</script>

{#if show}
    <button on:click|once={onNewButtonClick}><SaveIcon />New Album</button>
{/if}

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
