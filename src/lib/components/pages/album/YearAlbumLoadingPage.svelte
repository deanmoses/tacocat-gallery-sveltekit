<!--
  @component

  A "Year album is Loading" stencil page to show while waiting for an album to load
-->

<script lang="ts">
	import YearAlbumPageLayout from "./layouts/YearAlbumPageLayout.svelte";
	import PrevButton from "$lib/components/site/buttons/PrevButton.svelte";
	import UpButton from "$lib/components/site/buttons/UpButton.svelte";
	import NextButton from "$lib/components/site/buttons/NextButton.svelte";
	import WaitingSpinner from "$lib/components/site/WaitingSpinner.svelte";
import FullPageMessage from "$lib/components/site/FullPageMessage.svelte";

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