<!--
  @component

  Page to display an image
-->
<script lang="ts">
	import ImagePageLayout from './layouts/ImagePageLayout.svelte';
	import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
	import UpButton from '$lib/components/site/nav/UpButton.svelte';
	import NextButton from '$lib/components/site/nav/NextButton.svelte';
	import BigImage from './BigImage.svelte';
	import EditToggle from '$lib/components/site/edit/toggle/EditToggle.svelte';
	import type { Album, Image } from '$lib/models/album';

	export let year: string;
	export let album: Album;
	export let image: Image;
</script>

<ImagePageLayout {year} title={image.title}>
	<svelte:fragment slot="editControls">
		<EditToggle />
	</svelte:fragment>

	<svelte:fragment slot="title">
		{image.title}
	</svelte:fragment>

	<svelte:fragment slot="caption">
		{#if image.description}
			{@html image.description}
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="nav">
		<PrevButton href={image.prevImageHref} />
		<UpButton href={album.href} title={album.pageTitle} />
		<NextButton href={image.nextImageHref} />
	</svelte:fragment>

	<svelte:fragment slot="image">
		<BigImage {image} />
	</svelte:fragment>
</ImagePageLayout>
