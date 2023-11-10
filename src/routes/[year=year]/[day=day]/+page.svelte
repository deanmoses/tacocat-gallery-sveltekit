<script lang="ts">
    import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
    import DayAlbumPage from '$lib/components/pages/album/day/DayAlbumPage.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    $: year = data.year;
    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: status = $albumEntry.loadStatus;
</script>

<DayAlbumRouting {status} {year}>
    <svelte:fragment slot="loaded">
        <DayAlbumPage {album} {year} />
    </svelte:fragment>
</DayAlbumRouting>
