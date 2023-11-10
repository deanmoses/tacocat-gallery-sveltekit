<script lang="ts">
    import type { PageData } from './$types';
    export let data: PageData;

    import type { Readable } from 'svelte/store';
    import type { AlbumEntry } from '$lib/stores/AlbumStore';
    import RootAlbumRouting from '$lib/components/pages/album/root/RootAlbumRouting.svelte';

    let albumEntry: Readable<AlbumEntry> = data.albumEntry;
</script>

<RootAlbumRouting status={$albumEntry.loadStatus} album={$albumEntry.album} />
