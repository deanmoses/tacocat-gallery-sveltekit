<!--
  @component

  Flip through different statuses of a day album
-->
<script lang="ts">
	import AlbumLoadingPage from "$lib/components/pages/album/AlbumLoadingPage.svelte";
	import AlbumErrorPage from "$lib/components/pages/album/AlbumErrorPage.svelte";
	import { AlbumLoadStatus } from "$lib/models/album";
	import HomeIcon from "$lib/components/site/icons/HomeIcon.svelte";

	export let year: string;
	export let status: AlbumLoadStatus;
</script>

{#if status === AlbumLoadStatus.NOT_LOADED || status === AlbumLoadStatus.LOADING}
	<AlbumLoadingPage {year} />
{:else if status === AlbumLoadStatus.LOADED}
	<slot name="loaded" />
{:else if status === AlbumLoadStatus.ERROR_LOADING}
	<AlbumErrorPage {year}>
		Error retrieving album
	</AlbumErrorPage>
{:else if status === AlbumLoadStatus.DOES_NOT_EXIST}
	<AlbumErrorPage {year} title="Album Not Found">
		<p>Album does not exist.</p>
		<p><a href="/">Go back <HomeIcon />?</a></p>
	</AlbumErrorPage>
{:else}
	Unknown album status: {status}
{/if}