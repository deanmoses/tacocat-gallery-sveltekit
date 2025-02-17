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
            {#if albumState.editMode}
                {#await import('$lib/components/pages/album/year/YearAlbumEditPage.svelte') then { default: YearAlbumEditPage }}
                    <YearAlbumEditPage {album} />
                {/await}
            {:else}
                <YearAlbumPage {album} />
            {/if}
        {/if}
    {/snippet}
</YearAlbumRouting>
