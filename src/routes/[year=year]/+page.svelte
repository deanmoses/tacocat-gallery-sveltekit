<script lang="ts">
	import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
	import YearAlbumPage from '$lib/components/pages/album/year/YearAlbumPage.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: year = data.year;
	$: albumEntry = data.albumEntry;
	$: album = $albumEntry.album;
	$: status = $albumEntry.loadStatus;
</script>

<YearAlbumRouting {status} {year}>
	<svelte:fragment slot="loaded">
		<YearAlbumPage {album} {year} />
	</svelte:fragment>
</YearAlbumRouting>
