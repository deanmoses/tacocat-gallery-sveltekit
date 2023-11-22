<script lang="ts">
    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumPage from '$lib/components/pages/album/year/YearAlbumPage.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: loadStatus = $albumEntry.loadStatus;
    $: deleteEntryStore = data.deleteEntry;
    $: deleteEntry = $deleteEntryStore;
</script>

<YearAlbumRouting {loadStatus} {deleteEntry}>
    <svelte:fragment slot="loaded">
        {#if album}
            <YearAlbumPage {album} />
        {/if}
    </svelte:fragment>
</YearAlbumRouting>
