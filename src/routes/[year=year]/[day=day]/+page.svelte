<script lang="ts">
    import type { PageProps } from './$types';
    import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
    import DayAlbumPage from '$lib/components/pages/album/day/DayAlbumPage.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

    let { data }: PageProps = $props();
    let albumPath = $derived(data.albumPath);
    let album = $derived(albumState.albums.get(albumPath)?.album);
</script>

<DayAlbumRouting {albumPath}>
    {#snippet loaded()}
        {#if album}
            {#if albumState.editMode}
                {#await import('$lib/components/pages/album/day/DayAlbumEditPage.svelte') then { default: DayAlbumEditPage }}
                    <DayAlbumEditPage {album} />
                {/await}
            {:else}
                <DayAlbumPage {album} />
            {/if}
        {/if}
    {/snippet}
</DayAlbumRouting>
