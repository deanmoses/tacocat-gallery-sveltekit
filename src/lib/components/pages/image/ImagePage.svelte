<!--
  @component

  Page to display an image
-->

<script lang="ts">
	import ImagePageLayout from "./layouts/ImagePageLayout.svelte";
	import EditToggle from "$lib/components/site/editControls/EditToggle.svelte";
	import Header from "$lib/components/site/Header.svelte";
	import PrevButton from "$lib/components/site/nav/PrevButton.svelte";
	import UpButton from "$lib/components/site/nav/UpButton.svelte";
	import NextButton from "$lib/components/site/nav/NextButton.svelte";
	import EditableHtml from "$lib/components/site/EditableHtml.svelte";

	export let year: string;
	export let album;
	export let image;
	let title = image.title;
</script>

<ImagePageLayout {title} {year}>

	<svelte:fragment slot="editControls">
		<EditToggle />
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
		<NextButton href={image.nextImageHref} />
	</svelte:fragment>

	<svelte:fragment slot="image">
		<a href="https://tacocat.com{image.url_full}" target="zen"><img src="https://cdn.tacocat.com{image.url_sized}" style="object-fit: contain; width: 100%; height: 100%; max-width: 4032px; max-height: 3024px;" alt="{image.title}"></a>
	</svelte:fragment>
	
</ImagePageLayout>