<!--
  @component

  Page to edit a day album
-->

<script lang="ts">
	import DayAlbumPageLayout from "./DayAlbumPageLayout.svelte";
	import AlbumEditControls from "$lib/components/site/editControls/AlbumEditControls.svelte";
	import PrevButton from "$lib/components/site/nav/PrevButton.svelte";
  import UpButton from "$lib/components/site/nav/UpButton.svelte";
  import NextButton from "$lib/components/site/nav/NextButton.svelte";
	import DayAlbumThumbnails from "./DayAlbumThumbnails.svelte";
	import EditableHtml from "$lib/components/site/EditableHtml.svelte";

	export let year:string;
  export let album;

	function editUrl(url:string):string {
		return url ? `${url}/edit` : null;
	}
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
	</svelte:fragment>

	<svelte:fragment slot="caption">
		<EditableHtml htmlContent={$album.desc}/>
	</svelte:fragment>

	<svelte:fragment slot="thumbnails">
		<DayAlbumThumbnails {album} />
	</svelte:fragment>

</DayAlbumPageLayout>