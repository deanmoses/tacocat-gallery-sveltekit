<!--
  @component

  Flip through different statuses of a year album
-->

<script lang="ts">
	import YearAlbumLoadingPage from "$lib/components/pages/album/year/YearAlbumLoadingPage.svelte";
	import AlbumErrorPage from "$lib/components/pages/album/AlbumErrorPage.svelte";
	import { AlbumLoadStatus } from "$lib/models/album";

	export let year: string;
	export let status: AlbumLoadStatus;
</script>

{#if status === AlbumLoadStatus.NOT_LOADED || status === AlbumLoadStatus.LOADING}
	<YearAlbumLoadingPage {year} />
{:else if status === AlbumLoadStatus.LOADED}
	<slot name="loaded" />
{:else if status === AlbumLoadStatus.ERROR_LOADING}
	<AlbumErrorPage {year}>
		Error retrieving album
	</AlbumErrorPage>
{:else if status === AlbumLoadStatus.DOES_NOT_EXIST}
	<AlbumErrorPage>
		<p>Album does not exist</p>
		<p><a href="/">Go back home?</a></p>
	</AlbumErrorPage>
{:else}
	Unknown album status: {status}
{/if}