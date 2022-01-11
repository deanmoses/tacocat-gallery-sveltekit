<!--
  @component

  Route for editing a day album
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
  import DayAlbumEditPage from "$lib/components/pages/album/day/DayAlbumEditPage.svelte";

	export let year:string;
  export let albumEntry: Readable<AlbumEntry>;
</script>

<DayAlbumRouting status={$albumEntry.loadStatus} {year}>
	<svelte:fragment slot="loaded">
		<DayAlbumEditPage album={$albumEntry.album} {year}/>
	</svelte:fragment>
</DayAlbumRouting>