<script lang="ts">
    import type { PageProps } from './$types';
    import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
    import DayAlbumEditPage from '$lib/components/pages/album/day/DayAlbumEditPage.svelte';
    import { albumStore } from '$lib/stores/AlbumStore.svelte';

    let { data }: PageProps = $props();
    let path = $derived(data.albumPath);
    let albumEntry = $derived(albumStore.albums.get(path));
    let album = $derived(albumEntry?.album);
    let loadStatus = $derived(albumEntry?.loadStatus);
</script>

<DayAlbumRouting {path} {loadStatus}>
    {#snippet loaded()}
        {#if album}
            <DayAlbumEditPage {album} />
        {/if}
    {/snippet}
</DayAlbumRouting>
