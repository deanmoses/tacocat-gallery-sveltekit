<script lang="ts">
    import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
    import DayAlbumPage from '$lib/components/pages/album/day/DayAlbumPage.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: loadStatus = $albumEntry.loadStatus;
    $: deleteEntryStore = data.deleteEntry;
    $: deleteEntry = $deleteEntryStore;
    $: renameEntryStore = data.renameEntry;
    $: renameEntry = $renameEntryStore;
    $: uploadEntries = data.uploads;
    $: uploads = $uploadEntries;
</script>

<DayAlbumRouting {loadStatus} {deleteEntry} {renameEntry}>
    <svelte:fragment slot="loaded">
        {#if album}
            <DayAlbumPage {album} {uploads} />
        {/if}
    </svelte:fragment>
</DayAlbumRouting>
