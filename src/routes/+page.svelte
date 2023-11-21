<script lang="ts">
    import type { PageData } from './$types';
    import type { Readable } from 'svelte/store';
    import type { AlbumEntry } from '$lib/stores/AlbumStore';
    import RootAlbumRouting from '$lib/components/pages/album/root/RootAlbumRouting.svelte';

    export let data: PageData;

    let albumEntry: Readable<AlbumEntry> = data.albumEntry;
    $: album = $albumEntry.album;
    $: status = $albumEntry.loadStatus;
</script>

<RootAlbumRouting {status} {album} />
