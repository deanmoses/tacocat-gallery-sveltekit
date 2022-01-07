<!--
  @component

  Layout of an image page for displaying waiting or error.
	For use when you don't actually have an image to display.
-->

<script lang="ts">
	import ImagePageLayout from "./ImagePageLayout.svelte";
	import Header from "$lib/components/site/Header.svelte";
	import PrevButton from "$lib/components/site/buttons/PrevButton.svelte";
	import UpButton from "$lib/components/site/buttons/UpButton.svelte";
	import NextButton from "$lib/components/site/buttons/NextButton.svelte";
	import FullPageMessage from "$lib/components/site/FullPageMessage.svelte";

	export let year: string;
	export let title: string;
</script>

<ImagePageLayout {year} {title}>
	<svelte:fragment slot="header">
		<Header />
	</svelte:fragment>
	<svelte:fragment slot="nav">
		<PrevButton />
		<UpButton />
		<NextButton />
	</svelte:fragment>
	<svelte:fragment slot="image">
		<FullPageMessage>
			<slot />
		</FullPageMessage>
	</svelte:fragment>
</ImagePageLayout>