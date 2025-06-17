<script lang="ts">
    import type { PageProps } from './$types';
    import AlbumRouting from '$lib/components/pages/album/AlbumRouting.svelte';
    import YearAlbumPage from '$lib/components/pages/album/year/YearAlbumPage.svelte';
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
                {#await import('$lib/components/pages/album/year/YearAlbumEditPage.svelte') then { default: YearAlbumEditPage }}
                    <YearAlbumEditPage {album} />
                {/await}
            {:else}
                <YearAlbumPage {album} />
            {/if}
        {/if}
    {/snippet}
</AlbumRouting>
