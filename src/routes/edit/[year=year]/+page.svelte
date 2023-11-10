<script lang="ts">
    import type { PageData } from './$types';
    export let data: PageData;

    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumEditPage from '$lib/components/pages/album/year/YearAlbumEditPage.svelte';

    $: year = data.year;
    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: status = $albumEntry.loadStatus;
</script>

<YearAlbumRouting {status} {year}>
    <svelte:fragment slot="loaded">
        <YearAlbumEditPage {album} {year} />
    </svelte:fragment>
</YearAlbumRouting>
