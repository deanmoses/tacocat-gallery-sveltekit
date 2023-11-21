<script lang="ts">
    import type { PageData } from './$types';
    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumEditPage from '$lib/components/pages/album/year/YearAlbumEditPage.svelte';

    export let data: PageData;

    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: status = $albumEntry.loadStatus;
</script>

<YearAlbumRouting {status}>
    <svelte:fragment slot="loaded">
        {#if album}
            <YearAlbumEditPage {album} />
        {/if}
    </svelte:fragment>
</YearAlbumRouting>
