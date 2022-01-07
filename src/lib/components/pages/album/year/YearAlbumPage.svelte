<!--
  @component

  Page showing a year album
-->

<script lang="ts">
	import YearAlbumPageLayout from "./YearAlbumPageLayout.svelte";
	import PrevButton from "$lib/components/site/buttons/PrevButton.svelte";
	import UpButton from "$lib/components/site/buttons/UpButton.svelte";
	import NextButton from "$lib/components/site/buttons/NextButton.svelte";
	import EditableHtml from "$lib/components/site/EditableHtml.svelte";
	import YearAlbumThumbnails from "./YearAlbumThumbnails.svelte";

	export let album;
	export let year: string;
</script>

<YearAlbumPageLayout {year}>

	<svelte:fragment slot="nav">
		<PrevButton 
			href={$album.nextAlbumHref}
			title={$album.nextAlbumTitle}
		/>
		<UpButton href="../" title="All Years" />
		<NextButton
			href={$album.prevAlbumHref}
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