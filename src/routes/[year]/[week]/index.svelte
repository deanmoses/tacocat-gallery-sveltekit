<!--
  @component

  Route for a week album
-->

<script context="module" lang="ts">
  /** @type {import('@sveltejs/kit').Load} */
	export async function load({ params }) {
    const albumPath = `${params.year}/${params.week}`;
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
  import WeekAlbumPage from "$lib/components/pages/album/WeekAlbumPage.svelte";
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";

  export let albumPath;
  export let album;
</script>

{#await AlbumStoreHelpers.fetchAlbum(albumPath)}
  <AlbumLoadingPage />
{:then}
  <WeekAlbumPage album={album} />
{:catch error}
  Error fetching album: {error}
{/await}