<!--
  @component

  Page to edit an image
-->

<script lang="ts">
	import ImagePageLayout from "./layouts/ImagePageLayout.svelte";
	import PrevButton from "$lib/components/site/nav/PrevButton.svelte";
	import UpButton from "$lib/components/site/nav/UpButton.svelte";
	import NextButton from "$lib/components/site/nav/NextButton.svelte";
	import ImageEditControls from "$lib/components/site/edit/controls/ImageEditControls.svelte";
	import EditableText from "$lib/components/site/edit/EditableText.svelte";
	import EditableHtml from "$lib/components/site/edit/EditableHtml.svelte";
	import { editUrl } from "$lib/utils/path-utils";
	import DraftStore from "$lib/stores/DraftStore";
	import { DraftStatus } from "$lib/models/models";
	
	export let year: string;
	export let album;
	export let image;

	let status = DraftStore.getStatus();

	let okToNavigate: boolean;
	$: okToNavigate =  $status !== DraftStatus.UNSAVED_CHANGES && $status != DraftStatus.SAVING;
</script>

<ImagePageLayout {year} title={image.title}>

	<svelte:fragment slot="editControls">
		<ImageEditControls />
	</svelte:fragment>

	<svelte:fragment slot="title">
		<EditableText textContent={image.title} />
	</svelte:fragment>

	<svelte:fragment slot="caption">
		<EditableHtml htmlContent={image.desc}/>
	</svelte:fragment>

	<svelte:fragment slot="nav">
		{#if okToNavigate}
			<PrevButton href={editUrl(image.prevImageHref)} />
			<UpButton href={editUrl($album.href)} title={$album.pageTitle}/>
			<NextButton href={editUrl(image.nextImageHref)}  />
		{:else}
			<PrevButton />
			<UpButton title={$album.pageTitle}/>
			<NextButton />
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="image">
		<a href="https://tacocat.com{image.url_full}" target="zen"><img src="https://cdn.tacocat.com{image.url_sized}" style="object-fit: contain; width: 100%; height: 100%; max-width: 4032px; max-height: 3024px;" alt="{image.title}"></a>
	</svelte:fragment>

</ImagePageLayout>