<script context="module" lang="ts">
  /** @type {import('@sveltejs/kit').Load} */
	export async function load({ page }) {
    const albumPath = page.params.year;
    return {
      props: {
        albumPath,
        album: AlbumStoreHelpers.getAlbum(albumPath)
      }
    }
  }
</script>

<script lang="ts">
    import AlbumLoadingPage from "$lib/pages/album/AlbumLoadingPage.svelte";
    import YearAlbumPage from "$lib/pages/album/YearAlbumPage.svelte";
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