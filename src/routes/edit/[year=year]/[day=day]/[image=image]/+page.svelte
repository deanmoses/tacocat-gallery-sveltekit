<script lang="ts">
	import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
	import ImageEditPage from '$lib/components/pages/image/ImageEditPage.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: year = data.year;
	$: albumEntry = data.albumEntry;
	$: album = $albumEntry.album;
	$: status = $albumEntry.loadStatus;
	$: imagePath = data.imagePath;
	$: image = album?.getImage(imagePath);
</script>

<ImageRouting {status} {image} {year}>
	<svelte:fragment slot="loaded">
		<ImageEditPage {year} {album} {image} />
	</svelte:fragment>
</ImageRouting>
