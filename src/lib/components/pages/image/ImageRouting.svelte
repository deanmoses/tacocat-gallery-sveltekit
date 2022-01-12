<!--
  @component

  Flip through different album loading statuses of a photo
-->

<script lang="ts">
	import { AlbumLoadStatus } from "$lib/models/album";
	import ImageLoadingPage from "$lib/components/pages/image/ImageLoadingPage.svelte";
	import ImageErrorPage from "./ImageErrorPage.svelte";
	import HomeIcon from "$lib/components/site/icons/HomeIcon.svelte";

	export let year: string;
	export let status: AlbumLoadStatus;
</script>

{#if status === AlbumLoadStatus.NOT_LOADED || status === AlbumLoadStatus.LOADING}
	<ImageLoadingPage {year} />
{:else if status === AlbumLoadStatus.LOADED}
	<slot name="loaded" />
{:else if status === AlbumLoadStatus.ERROR_LOADING}
	<ImageErrorPage {year}>
		Error retrieving album
	</ImageErrorPage>
{:else if status === AlbumLoadStatus.DOES_NOT_EXIST}
	<ImageErrorPage {year} title="Album Not Found">
		<p>Album does not exist.</p>
		<p><a href="/">Go back <HomeIcon title="Home" />?</a></p>
	</ImageErrorPage>
{:else}
	Unknown album status: {status}
{/if}