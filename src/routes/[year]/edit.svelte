<!--
  @component

  Route to edit a year album
-->

<script context="module" lang="ts">
  /** @type {import('@sveltejs/kit').Load} */
	export async function load({ params }) {
		const year = params.year;
		const albumPath = params.year;
    return {
      props: {
				year,
        albumPath,
        album: AlbumStoreHelpers.getAlbum(albumPath)
      }
    }
  }
</script>

<script lang="ts">
	import YearAlbumLoadingPage from "$lib/components/pages/album/year/YearAlbumLoadingPage.svelte";
	import YearAlbumEditPage from "$lib/components/pages/album/year/YearAlbumEditPage.svelte";
	import AlbumErrorPage from "$lib/components/pages/album/AlbumErrorPage.svelte";
	import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";

	export let year: string;
	export let albumPath: string;
	export let album;
</script>

{#await AlbumStoreHelpers.fetchAlbum(albumPath)}
  <YearAlbumLoadingPage {year} />
{:then}
  <YearAlbumEditPage {year} album={album} />
{:catch error}
	<AlbumErrorPage {year}>
		Error fetching album: {error}
	</AlbumErrorPage>
{/await}