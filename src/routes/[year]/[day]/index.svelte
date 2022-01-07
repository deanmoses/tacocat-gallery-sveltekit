<!--
  @component

  Route for a day album
-->

<script context="module" lang="ts">
  /** @type {import('@sveltejs/kit').Load} */
	export async function load({ params }) {
		const year = params.year;
    const albumPath = `${params.year}/${params.day}`;
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
	import AlbumLoadingPage from "$lib/components/pages/album/AlbumLoadingPage.svelte";
  import DayAlbumPage from "$lib/components/pages/album/day/DayAlbumPage.svelte";
	import AlbumErrorPage from "$lib/components/pages/album/AlbumErrorPage.svelte";
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";

	export let year:string;
  export let albumPath:string;
  export let album;
</script>

{#await AlbumStoreHelpers.fetchAlbum(albumPath)}
  <AlbumLoadingPage />
{:then}
  <DayAlbumPage album={album} {year} />
{:catch error}
	<AlbumErrorPage>
		Error fetching album: {error}
	</AlbumErrorPage>
{/await}