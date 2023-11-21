<script lang="ts">
    import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
    import DayAlbumEditPage from '$lib/components/pages/album/day/DayAlbumEditPage.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: status = $albumEntry.loadStatus;
</script>

<DayAlbumRouting {status}>
    <svelte:fragment slot="loaded">
        {#if album}
            <DayAlbumEditPage {album} />
        {/if}
    </svelte:fragment>
</DayAlbumRouting>
