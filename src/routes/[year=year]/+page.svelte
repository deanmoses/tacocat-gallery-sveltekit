<script lang="ts">
    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumPage from '$lib/components/pages/album/year/YearAlbumPage.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: status = $albumEntry.loadStatus;
</script>

<YearAlbumRouting {status}>
    <svelte:fragment slot="loaded">
        {#if album}
            <YearAlbumPage {album} />
        {/if}
    </svelte:fragment>
</YearAlbumRouting>
