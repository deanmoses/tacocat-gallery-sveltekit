<script context="module" lang="ts">
	export async function load({ page }) {
    const albumPath = `${page.params.year}/${page.params.week}`;
    const photoPath = `${albumPath}/${page.params.photo}`
    return {
      props: {
        albumPath,
        photoPath,
        album: AlbumStoreHelpers.getAlbum(albumPath)
      }
    }
  }
</script>

<script lang="ts">
  import PhotoPage from "$lib/pages/photo/PhotoPage.svelte";
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";

  export let albumPath;
  export let photoPath;
  export let album;
</script>

{#await AlbumStoreHelpers.fetchAlbum(albumPath)}
  LOADING
{:then}
  <PhotoPage album={album} photoPath={photoPath}/>
{:catch error}
  Error fetching album: {error}
{/await}