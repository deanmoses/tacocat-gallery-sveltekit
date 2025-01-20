<script lang="ts">
    import type { PageProps } from './$types';
    import type { Readable } from 'svelte/store';
    import type { AlbumEntry } from '$lib/models/album';
    import RootAlbumRouting from '$lib/components/pages/album/root/RootAlbumRouting.svelte';

    let { data }: PageProps = $props();
    let albumEntry: Readable<AlbumEntry> = data.albumEntry;
    let album = $derived($albumEntry.album);
    let status = $derived($albumEntry.loadStatus);
</script>

<RootAlbumRouting {status} {album} />
