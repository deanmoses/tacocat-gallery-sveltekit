<script lang="ts">
    import RootAlbumRouting from '$lib/components/pages/album/root/RootAlbumRouting.svelte';
    import type { AlbumLoadStatus } from '$lib/models/album';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import { albumStore } from '$lib/stores/AlbumStore.svelte';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    let path = $derived(data.pathToRootAlbum);
    let albumEntry = $derived(albumStore.albums.get(path));
    let album: Album | undefined = $derived(albumEntry?.album);
    let status: AlbumLoadStatus | undefined = $derived(albumEntry?.loadStatus);
</script>

<RootAlbumRouting {status} {album} />
