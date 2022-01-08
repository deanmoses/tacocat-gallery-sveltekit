<!--
  @component

  Page to edit a day album
-->

<script lang="ts">
	import DayAlbumPageLayout from "./DayAlbumPageLayout.svelte";
	import PrevButton from "$lib/components/site/nav/PrevButton.svelte";
  import UpButton from "$lib/components/site/nav/UpButton.svelte";
  import NextButton from "$lib/components/site/nav/NextButton.svelte";
	import DayAlbumThumbnails from "./DayAlbumThumbnails.svelte";
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
		{#if $okToNavigate}
			<PrevButton
				href={editUrl($album.nextAlbumHref)}
				title={$album.nextAlbumTitle}
			/>
			<UpButton
				href={editUrl($album.parentAlbumHref)}
				title={$album.parentAlbumTitle}
			/>
			<NextButton 
				href={editUrl($album.prevAlbumHref)}
				title={$album.prevAlbumTitle}
			/>
		{:else}
			<PrevButton title={$album.nextAlbumTitle} />
			<UpButton title={$album.pageTitle} />
			<NextButton title={$album.prevAlbumTitle} />
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="caption">
		<EditableHtml htmlContent={$album.desc}/>
	</svelte:fragment>

	<svelte:fragment slot="thumbnails">
		<DayAlbumThumbnails {album} />
	</svelte:fragment>

</DayAlbumPageLayout>