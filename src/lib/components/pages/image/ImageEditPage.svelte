<!--
  @component

  Page to edit an image
-->

<script lang="ts">
	import ImagePageLayout from "./layouts/ImagePageLayout.svelte";
	import Header from "$lib/components/site/Header.svelte";
	import PrevButton from "$lib/components/site/buttons/PrevButton.svelte";
	import UpButton from "$lib/components/site/buttons/UpButton.svelte";
	import NextButton from "$lib/components/site/buttons/NextButton.svelte";
	import EditableHtml from "$lib/components/site/EditableHtml.svelte";
	import EditControls from "$lib/components/site/EditControls.svelte";

	export let year: string;
	export let album;
	export let image;
	let title = image.title;
</script>

<ImagePageLayout {title} {year}>
	<svelte:fragment slot="editControls">
		<EditControls />
	</svelte:fragment>
	<svelte:fragment slot="header">
		<Header title="{image.title}" hideSiteTitle/>
	</svelte:fragment>
	<svelte:fragment slot="caption">
		<EditableHtml htmlContent={image.desc}/>
	</svelte:fragment>
	<svelte:fragment slot="nav">
		<PrevButton href={image.prevImageHref} />
		<UpButton href={$album.href} title={$album.pageTitle}/>
		<NextButton href={image.nextImageHref}  />
	</svelte:fragment>
	<svelte:fragment slot="image">
		<a href="https://tacocat.com{image.url_full}" target="zen"><img src="https://cdn.tacocat.com{image.url_sized}" style="object-fit: contain; width: 100%; height: 100%; max-width: 4032px; max-height: 3024px;" alt="{image.title}"></a>
	</svelte:fragment>
</ImagePageLayout>