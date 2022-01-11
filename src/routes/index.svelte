<!--
  @component

  The root route of the gallery
-->
<script lang="ts">
	import type { Readable } from "svelte/store";
	import { albumStore } from "$lib/stores/AlbumStore";
	import type { AlbumEntry } from "$lib/stores/AlbumStore";
	import RootAlbumRouting from "$lib/components/pages/album/root/RootAlbumRouting.svelte";

  const pathToRootAlbum = "";
	let albumEntry: Readable<AlbumEntry> = albumStore.get(pathToRootAlbum);
</script>

<RootAlbumRouting status={$albumEntry.loadStatus} album={$albumEntry.album} />