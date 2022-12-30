<!--
  @component

  Page showing a day album
-->
<script lang="ts">
	import DayAlbumPageLayout from './DayAlbumPageLayout.svelte';
	import EditToggle from '$lib/components/site/edit/toggle/EditToggle.svelte';
	import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
	import UpButton from '$lib/components/site/nav/UpButton.svelte';
	import NextButton from '$lib/components/site/nav/NextButton.svelte';
	import Thumbnail from '$lib/components/site/Thumbnail.svelte';
	import Config from '$lib/utils/config';
	import type { Album } from '$lib/models/album';

	export let year: string;
	export let album: Album;
</script>

<DayAlbumPageLayout {year} title={album.pageTitle}>
	<svelte:fragment slot="editControls">
		<EditToggle />
	</svelte:fragment>

	<svelte:fragment slot="title">
		{album.pageTitle}
	</svelte:fragment>

	<svelte:fragment slot="nav">
		<PrevButton href={album.nextAlbumHref} title={album.nextAlbumTitle} />
		<UpButton href={album.parentAlbumHref} title={album.parentAlbumTitle} />
		<NextButton href={album.prevAlbumHref} title={album.prevAlbumTitle} />
	</svelte:fragment>

	<svelte:fragment slot="caption">
		{#if album.description}
			{@html album.description}
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="thumbnails">
		{#if album.images}
			{#each album.images as image (image.path)}
				<Thumbnail
					title={image.title}
					summary={image.customdata}
					href="/{image.path}"
					src={Config.cdnUrl(image.url_thumb)}
				/>
			{/each}
		{/if}
	</svelte:fragment>
</DayAlbumPageLayout>
