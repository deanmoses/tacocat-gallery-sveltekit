<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import type { Readable } from 'svelte/store';
	import type { AlbumEntry } from '$lib/stores/AlbumStore';
	import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
	import ImageEditPage from '$lib/components/pages/image/ImageEditPage.svelte';

	export let year: string = data.year;
	export let imagePath: string = data.imagePath;
	export let albumEntry: Readable<AlbumEntry> = data.albumEntry;
</script>

<ImageRouting status={$albumEntry.loadStatus} {year}>
	<svelte:fragment slot="loaded">
		<ImageEditPage {year} album={$albumEntry.album} image={$albumEntry.album.getImage(imagePath)} />
	</svelte:fragment>
</ImageRouting>
