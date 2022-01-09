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

	export let year:string;
  export let album;

	let okToNavigate = DraftStore.getOkToNavigate();
</script>

<DayAlbumPageLayout {year} title={$album.pageTitle}>

	<svelte:fragment slot="editControls">
		<AlbumEditControls />
	</svelte:fragment>

	<svelte:fragment slot="title">
		{$album.pageTitle}
	</svelte:fragment>

	<svelte:fragment slot="nav">
		<PrevButton
			href={$okToNavigate ? editUrl($album.nextAlbumHref): null}
			title={$album.nextAlbumTitle}
		/>
		<UpButton
			href={$okToNavigate ? editUrl($album.parentAlbumHref) : null}
			title={$album.parentAlbumTitle}
		/>
		<NextButton 
			href={$okToNavigate ? editUrl($album.prevAlbumHref) : null}
			title={$album.prevAlbumTitle}
		/>
	</svelte:fragment>

	<svelte:fragment slot="caption">
		<EditableHtml htmlContent={$album.desc}/>
	</svelte:fragment>

	<svelte:fragment slot="thumbnails">
		{#if $album.images}
		{#each $album.images as image (image.path)}
			<Thumbnail
				title={image.title}
				summary={image.customdata}
				href={$okToNavigate ? `/${editUrl(image.path)}` : null}
				src={Config.cdnUrl(image.url_thumb)}>
				<svelte:fragment slot="selectionControls">
					<SelectableStar selected={image.url_thumb.endsWith($album.url_thumb)} />
				</svelte:fragment>
			</Thumbnail>
		{/each}
		{/if}
	</svelte:fragment>

</DayAlbumPageLayout>