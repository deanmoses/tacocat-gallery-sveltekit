<script lang="ts">
    import type { PageProps } from './$types';
    import AlbumRouting from '$lib/components/pages/album/AlbumRouting.svelte';
    import DayAlbumPage from '$lib/components/pages/album/day/DayAlbumPage.svelte';
    import { albumState } from '$lib/state/AlbumState.svelte';
    import type { Album } from '$lib/models/GalleryItemInterfaces';

    let { data }: PageProps = $props();
    let albumPath: string = $derived(data.albumPath);
    let album: Album | undefined = $derived(albumState.albums.get(albumPath)?.album);
</script>

<AlbumRouting {albumPath}>
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
</AlbumRouting>
