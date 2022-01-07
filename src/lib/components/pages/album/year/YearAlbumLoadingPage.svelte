<!--
  @component

  A "Year album is Loading" stencil page to show while waiting for an album to load
-->

<script lang="ts">
	import YearAlbumPageLayout from "./YearAlbumPageLayout.svelte";
	import PrevButton from "$lib/components/site/nav/PrevButton.svelte";
	import UpButton from "$lib/components/site/nav/UpButton.svelte";
	import NextButton from "$lib/components/site/nav/NextButton.svelte";
	import FullPageMessage from "$lib/components/site/FullPageMessage.svelte";
	import WaitingSpinner from "$lib/components/site/WaitingSpinner.svelte";

	export let year: string;
</script>

<YearAlbumPageLayout {year}>

	<svelte:fragment slot="nav">
		<PrevButton />
		<UpButton />
		<NextButton />
	</svelte:fragment>

	<svelte:fragment slot="thumbnails">
		<FullPageMessage>
			<WaitingSpinner />
		</FullPageMessage>
	</svelte:fragment>

</YearAlbumPageLayout>