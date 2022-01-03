<script context="module" lang="ts">
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
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";
  import PhotoPage from "$lib/pages/photo/PhotoPage.svelte";
  
  export let albumPath;
  export let photoPath;
  export let album;
</script>

{#await AlbumStoreHelpers.fetchAlbum(albumPath)}
  LOADING
{:then}
  <PhotoPage album={album} photo={$album.getImage(photoPath)}/>
{:catch error}
  Error fetching album: {error}
{/await}