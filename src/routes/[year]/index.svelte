<!--
  @component

  Route for a year album
-->

<script context="module" lang="ts">
  /** @type {import('@sveltejs/kit').Load} */
	export async function load({ params }) {
		const year = params.year;
		const albumPath = params.year;
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
	import YearAlbumRouting from "$lib/components/pages/album/year/YearAlbumRouting.svelte";
	import YearAlbumPage from "$lib/components/pages/album/year/YearAlbumPage.svelte";

	export let year: string;
	export let albumEntry: Readable<AlbumEntry>;
</script>

<YearAlbumRouting status={$albumEntry.loadStatus} {year}>
	<svelte:fragment slot="loaded">
		<YearAlbumPage album={$albumEntry.album} {year}/>
	</svelte:fragment>
</YearAlbumRouting>