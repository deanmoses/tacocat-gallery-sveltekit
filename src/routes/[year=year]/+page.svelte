<script lang="ts">
    import type { PageProps } from './$types';
    import type { DeleteEntry } from '$lib/models/album';
    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumPage from '$lib/components/pages/album/year/YearAlbumPage.svelte';
    import { albumStore } from '$lib/stores/AlbumStore.svelte';
    import { globalStore } from '$lib/stores/GlobalStore.svelte';

    let { data }: PageProps = $props();
    let path = $derived(data.albumPath);
    let albumEntry = $derived(albumStore.albums.get(path));
    let album = $derived(albumEntry?.album);
    let loadStatus = $derived(albumEntry?.loadStatus);
    let deleteEntry: DeleteEntry | undefined = $derived(globalStore.albumDeletes.get(path));
</script>

<YearAlbumRouting {loadStatus} {deleteEntry}>
    {#snippet loaded()}
        {#if album}
            <YearAlbumPage {album} />
        {/if}
    {/snippet}
</YearAlbumRouting>
