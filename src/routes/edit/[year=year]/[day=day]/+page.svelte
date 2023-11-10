<script lang="ts">
    import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
    import DayAlbumEditPage from '$lib/components/pages/album/day/DayAlbumEditPage.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    $: year = data.year;
    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: status = $albumEntry.loadStatus;
</script>

<DayAlbumRouting {status} {year}>
    <svelte:fragment slot="loaded">
        <DayAlbumEditPage {album} {year} />
    </svelte:fragment>
</DayAlbumRouting>
