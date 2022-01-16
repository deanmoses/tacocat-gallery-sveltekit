<!--
  @component

  Page to edit a day album
-->

<script lang="ts">
	import DayAlbumPageLayout from "./DayAlbumPageLayout.svelte";
	import PrevButton from "$lib/components/site/nav/PrevButton.svelte";
  import UpButton from "$lib/components/site/nav/UpButton.svelte";
  import NextButton from "$lib/components/site/nav/NextButton.svelte";
	import Thumbnail from "$lib/components/site/Thumbnail.svelte";
	import SelectableStar from "$lib/components/site/edit/SelectableStar.svelte";
	import Config from "$lib/utils/config";
	import AlbumEditControls from "$lib/components/site/edit/controls/AlbumEditControls.svelte";
	import EditableHtml from "$lib/components/site/edit/EditableHtml.svelte";
	import { editUrl } from "$lib/utils/path-utils";
	import DraftStore from "$lib/stores/DraftStore";
	import { setAlbumThumbnail } from "$lib/stores/AlbumThumbnailHelper";
	import type { Album } from "$lib/models/album";

	export let year: string;
  export let album: Album;

	let okToNavigate = DraftStore.getOkToNavigate();

	function albumThumbnailSelected(e: CustomEvent<{path: string}>) {		
		const imagePath = e.detail.path;
		console.log(`<DayAlbumEditPage>: thumbnail ${imagePath}`, e.detail);
		setAlbumThumbnail(album.path, imagePath);
	}
</script>

<DayAlbumPageLayout {year} title={album.pageTitle}>

	<svelte:fragment slot="editControls">
		<AlbumEditControls unpublished={album.unpublished} />
	</svelte:fragment>

	<svelte:fragment slot="title">
		{album.pageTitle}
	</svelte:fragment>

	<svelte:fragment slot="nav">
		<PrevButton
			href={$okToNavigate ? editUrl(album.nextAlbumHref): null}
			title={album.nextAlbumTitle}
		/>
		<UpButton
			href={$okToNavigate ? editUrl(album.parentAlbumHref) : null}
			title={album.parentAlbumTitle}
		/>
		<NextButton 
			href={$okToNavigate ? editUrl(album.prevAlbumHref) : null}
			title={album.prevAlbumTitle}
		/>
	</svelte:fragment>

	<svelte:fragment slot="caption">
		<EditableHtml htmlContent={album.desc}/>
	</svelte:fragment>

	<svelte:fragment slot="thumbnails">
		{#if album.images}
		{#each album.images as image (image.path)}
			{#if $okToNavigate}
				<Thumbnail
					title={image.title}
					summary={image.customdata}
					href={editUrl(`/${image.path}`)}
					src={Config.cdnUrl(image.url_thumb)}
				>
					<svelte:fragment slot="selectionControls">
						<SelectableStar selected={image.url_thumb.endsWith(album.url_thumb)} path={image.url_thumb} on:selected={albumThumbnailSelected} />
					</svelte:fragment>
				</Thumbnail>
			{:else}
				<div title="💾 Save changes before navigating">
					<Thumbnail
						title={image.title}
						summary={image.customdata}
						src={Config.cdnUrl(image.url_thumb)}
					/>
				</div>
			{/if}
		{/each}
		{/if}
	</svelte:fragment>

</DayAlbumPageLayout>

<style>
	div {
		cursor: not-allowed;
	}
	:global(.thumbnail:hover .notSelected) {
		animation: fadeIn 1400ms;
		display: inherit;
	}
	@keyframes fadeIn {
		0% {opacity:0;}
		25% {opacity:0;}
		100% {opacity:1;}
	}
</style>