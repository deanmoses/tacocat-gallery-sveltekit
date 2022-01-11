<!--
  @component

  Flip through different album loading statuses of a photo
-->

<script lang="ts">
	import { AlbumLoadStatus } from "$lib/models/album";
	import ImageLoadingPage from "$lib/components/pages/image/ImageLoadingPage.svelte";
	import ImageErrorPage from "./ImageErrorPage.svelte";

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
	<ImageErrorPage {year}>
		Album does not exist
	</ImageErrorPage>
{:else}
	Unknown album status: {status}
{/if}