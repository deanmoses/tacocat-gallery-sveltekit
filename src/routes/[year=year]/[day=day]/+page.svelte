<script lang="ts">
    import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
    import DayAlbumPage from '$lib/components/pages/album/day/DayAlbumPage.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: status = $albumEntry.loadStatus;
    $: renameEntryStore = data.renameEntry;
    $: renameEntry = $renameEntryStore;
    $: uppies = data.uploads;
    $: uploads = $uppies;
</script>

<DayAlbumRouting {status} {renameEntry}>
    <svelte:fragment slot="loaded">
        {#if album}
            <DayAlbumPage {album} {uploads} />
        {/if}
    </svelte:fragment>
</DayAlbumRouting>
