<script lang="ts">
    import type { PageProps } from './$types';
    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumPage from '$lib/components/pages/album/year/YearAlbumPage.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

    let { data }: PageProps = $props();
    let albumPath = $derived(data.albumPath);
    let album = $derived(albumState.albums.get(albumPath)?.album);
</script>

<YearAlbumRouting {albumPath}>
    {#snippet loaded()}
        {#if album}
            <YearAlbumPage {album} />
        {/if}
    {/snippet}
</YearAlbumRouting>
