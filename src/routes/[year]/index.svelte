<!--
  @component

  Route for a year album
-->

<script context="module" lang="ts">
  /** @type {import('@sveltejs/kit').Load} */
	export async function load({ params }) {
    const albumPath = params.year;
    return {
      props: {
        albumPath,
        album: AlbumStoreHelpers.getAlbum(albumPath)
      }
    }
  }
</script>

<script lang="ts">
    import AlbumLoadingPage from "$lib/components/pages/album/AlbumLoadingPage.svelte";
    import YearAlbumPage from "$lib/components/pages/album/YearAlbumPage.svelte";
    import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";

    export let albumPath;
    export let album;
</script>

{#await AlbumStoreHelpers.fetchAlbum(albumPath)}
  <AlbumLoadingPage />
{:then}
  <YearAlbumPage album={album} />
{:catch error}
  Error fetching album: {error}
{/await}