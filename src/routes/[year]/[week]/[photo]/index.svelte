<script context="module" lang="ts">
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";

	export async function load({ params }) {
    const albumPath = `${params.year}/${params.week}`;
    const photoPath = `${albumPath}/${params.photo}`
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