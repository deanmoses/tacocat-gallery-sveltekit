<script lang="ts">
    import type { PageProps } from './$types';
    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumEditPage from '$lib/components/pages/album/year/YearAlbumEditPage.svelte';

    let { data }: PageProps = $props();
    let albumEntry = $derived(data.albumEntry);
    let album = $derived($albumEntry.album);
    let status = $derived($albumEntry.loadStatus);
</script>

<YearAlbumRouting loadStatus={status}>
    {#snippet loaded()}
        {#if album}
            <YearAlbumEditPage {album} />
        {/if}
    {/snippet}
</YearAlbumRouting>
