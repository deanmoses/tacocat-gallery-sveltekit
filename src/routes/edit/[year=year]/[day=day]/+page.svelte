<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import type { Readable } from 'svelte/store';
	import type { AlbumEntry } from '$lib/stores/AlbumStore';
	import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
	import DayAlbumEditPage from '$lib/components/pages/album/day/DayAlbumEditPage.svelte';

	export let year: string = data.year;
	export let albumEntry: Readable<AlbumEntry> = data.albumEntry;
</script>

<DayAlbumRouting status={$albumEntry.loadStatus} {year}>
	<svelte:fragment slot="loaded">
		<DayAlbumEditPage album={$albumEntry.album} {year}/>
	</svelte:fragment>
</DayAlbumRouting>