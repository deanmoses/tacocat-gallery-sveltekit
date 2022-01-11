<!--
  @component

  Route for a day album
-->

<script context="module" lang="ts">
  /** @type {import('@sveltejs/kit').Load} */
	export async function load({ params }) {
		const year = params.year;
    const albumPath = `${params.year}/${params.day}`;
    return {
      props: {
				year,
        albumEntry: albumStore.get(albumPath)
      }
    }
  }
</script>

<script lang="ts">
	import type { Readable } from "svelte/store";
	import { AlbumEntry, albumStore } from "$lib/stores/AlbumStore";
	import DayAlbumRouting from "$lib/components/pages/album/day/DayAlbumRouting.svelte";
	import DayAlbumPage from "$lib/components/pages/album/day/DayAlbumPage.svelte";

	export let year: string;
  export let albumEntry: Readable<AlbumEntry>;
</script>

<DayAlbumRouting status={$albumEntry.loadStatus} {year}>
	<svelte:fragment slot="loaded">
		<DayAlbumPage album={$albumEntry.album} {year}/>
	</svelte:fragment>
</DayAlbumRouting>