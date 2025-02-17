<script lang="ts">
    import type { PageProps } from './$types';
    import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
    import DayAlbumEditPage from '$lib/components/pages/album/day/DayAlbumEditPage.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

    let { data }: PageProps = $props();
    let albumPath = $derived(data.albumPath);
    let album = $derived(albumState.albums.get(albumPath)?.album);
</script>

<DayAlbumRouting {albumPath}>
    {#snippet loaded()}
        {#if album}
            <DayAlbumEditPage {album} />
        {/if}
    {/snippet}
</DayAlbumRouting>
