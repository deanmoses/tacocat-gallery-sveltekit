<!--
  @component

  Page to edit a year album
-->

<script lang="ts">
	import YearAlbumPageLayout from "./YearAlbumPageLayout.svelte";
	import PrevButton from "$lib/components/site/nav/PrevButton.svelte";
	import UpButton from "$lib/components/site/nav/UpButton.svelte";
	import NextButton from "$lib/components/site/nav/NextButton.svelte";
	import YearAlbumThumbnails from "./YearAlbumThumbnails.svelte";
	import AlbumEditControls from "$lib/components/site/edit/controls/AlbumEditControls.svelte";
	import EditableHtml from "$lib/components/site/edit/EditableHtml.svelte";
	import { editUrl } from "$lib/utils/path-utils";

	export let album;
	export let year: string;
</script>

<YearAlbumPageLayout {year}>

	<svelte:fragment slot="editControls">
		<AlbumEditControls />
	</svelte:fragment>

	<svelte:fragment slot="nav">
		<PrevButton
			href={editUrl($album.nextAlbumHref)}
			title={$album.nextAlbumTitle}
		/>
		<UpButton href="../" title="All Years" />
		<NextButton 
			href={editUrl($album.prevAlbumHref)}
			title={$album.prevAlbumTitle}
		/>
	</svelte:fragment>

	<svelte:fragment slot="caption">
		<EditableHtml htmlContent={$album.desc}/>
	</svelte:fragment>

	<svelte:fragment slot="thumbnails">
		<YearAlbumThumbnails {album} />
	</svelte:fragment>

</YearAlbumPageLayout>