<script lang="ts">
    import type { PageProps } from './$types';
    import AlbumRouting from '$lib/components/pages/album/AlbumRouting.svelte';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import { albumState } from '$lib/state/AlbumState.svelte';
    import RootAlbumPage from '$lib/components/pages/album/root/RootAlbumPage.svelte';

    let { data }: PageProps = $props();
    let albumPath: string = $derived(data.pathToRootAlbum);
    let album: Album | undefined = $derived(albumState.albums.get(albumPath)?.album);
</script>

<AlbumRouting {albumPath}>
    {#snippet loaded()}
        {#if album}
            <RootAlbumPage {album} />
        {/if}
    {/snippet}
</AlbumRouting>
