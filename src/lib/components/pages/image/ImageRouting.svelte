<!--
  @component

  Flip through different album loading statuses of a photo
-->
<script lang="ts">
	import { AlbumLoadStatus, type Image } from '$lib/models/album';
	import ImageLoadingPage from '$lib/components/pages/image/ImageLoadingPage.svelte';
	import AlbumErrorPage from '../album/AlbumErrorPage.svelte';
	import HomeIcon from '$lib/components/site/icons/HomeIcon.svelte';

	export let year: string;
	export let image: Image | undefined;
	export let status: AlbumLoadStatus;
</script>

{#if status === AlbumLoadStatus.NOT_LOADED || status === AlbumLoadStatus.LOADING}
	<ImageLoadingPage {year} />
{:else if status === AlbumLoadStatus.LOADED && image}
	<slot name="loaded" />
{:else if status === AlbumLoadStatus.LOADED && !image}
	<AlbumErrorPage {year} title="Image Not Found">
		<p>Image not found</p>
		<p><a href="/">Go back <HomeIcon title="Home" />?</a></p>
	</AlbumErrorPage>
{:else if status === AlbumLoadStatus.ERROR_LOADING}
	<AlbumErrorPage {year}>
		<p>Error retrieving album</p>
		<p><a href="/">Go back <HomeIcon title="Home" />?</a></p>
	</AlbumErrorPage>
{:else if status === AlbumLoadStatus.DOES_NOT_EXIST}
	<AlbumErrorPage {year} title="Album Not Found">
		<p>Album not found</p>
		<p><a href="/">Go back <HomeIcon title="Home" />?</a></p>
	</AlbumErrorPage>
{:else}
	Unknown album status: {status}
{/if}
