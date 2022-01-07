<!--
  @component

  Page showing a day album
-->

<script lang="ts">
	import DayAlbumPageLayout from "./DayAlbumPageLayout.svelte";
	import EditToggle from "$lib/components/site/editControls/EditToggle.svelte";
	import PrevButton from "$lib/components/site/nav/PrevButton.svelte";
  import UpButton from "$lib/components/site/nav/UpButton.svelte";
  import NextButton from "$lib/components/site/nav/NextButton.svelte";
	import DayAlbumThumbnails from "./DayAlbumThumbnails.svelte";

	export let year:string;
  export let album;
</script>

<DayAlbumPageLayout {year} title={$album.pageTitle}>

	<svelte:fragment slot="editControls">
		<EditToggle />
	</svelte:fragment>

	<svelte:fragment slot="title">
		{$album.pageTitle}
	</svelte:fragment>

	<svelte:fragment slot="nav">
		<PrevButton
			href={$album.nextAlbumHref}
			title={$album.nextAlbumTitle}
		/>
		<UpButton
			href={$album.parentAlbumHref}
			title={$album.parentAlbumTitle}
		/>
		<NextButton 
			href={$album.prevAlbumHref}
			title={$album.prevAlbumTitle}
		/>
	</svelte:fragment>

	<svelte:fragment slot="caption">
		{@html $album.desc}
	</svelte:fragment>

	<svelte:fragment slot="thumbnails">
		<DayAlbumThumbnails {album} />
	</svelte:fragment>

</DayAlbumPageLayout>