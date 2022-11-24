<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import type { Readable } from "svelte/store";
	import type { AlbumEntry } from "$lib/stores/AlbumStore";
	import YearAlbumRouting from "$lib/components/pages/album/year/YearAlbumRouting.svelte";
	import YearAlbumPage from "$lib/components/pages/album/year/YearAlbumPage.svelte";

	export let year: string = data.year;
	export let albumEntry: Readable<AlbumEntry> = data.albumEntry;
</script>

<YearAlbumRouting status={$albumEntry.loadStatus} {year}>
	<svelte:fragment slot="loaded">
		<YearAlbumPage album={$albumEntry.album} {year}/>
	</svelte:fragment>
</YearAlbumRouting>