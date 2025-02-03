<script lang="ts">
    import type { PageProps } from './$types';
    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumEditPage from '$lib/components/pages/album/year/YearAlbumEditPage.svelte';
    import { albumStore } from '$lib/stores/AlbumStore.svelte';

    let { data }: PageProps = $props();
    let path = $derived(data.albumPath);
    let albumEntry = $derived(albumStore.albums.get(path));
    let album = $derived(albumEntry?.album);
    let loadStatus = $derived(albumEntry?.loadStatus);
</script>

<YearAlbumRouting {loadStatus}>
    {#snippet loaded()}
        {#if album}
            <YearAlbumEditPage {album} />
        {/if}
    {/snippet}
</YearAlbumRouting>
