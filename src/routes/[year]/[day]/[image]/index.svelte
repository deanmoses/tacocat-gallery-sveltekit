<script context="module" lang="ts">
	export async function load({ params }) {
    const albumPath = `${params.year}/${params.day}`;
    const imagePath = `${albumPath}/${params.image}`
    return {
      props: {
        albumPath,
        imagePath: imagePath,
        album: AlbumStoreHelpers.getAlbum(albumPath)
      }
    }
  }
</script>

<script lang="ts">
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";
  import ImageLoadingPage from "$lib/components/pages/image/ImageLoadingPage.svelte";
  import ImagePage from "$lib/components/pages/image/ImagePage.svelte";
  
  export let albumPath;
  export let imagePath;
  export let album;
</script>

{#await AlbumStoreHelpers.fetchAlbum(albumPath)}
  <ImageLoadingPage />
{:then}
  <ImagePage album={album} image={$album.getImage(imagePath)}/>
{:catch error}
  Error fetching image: {error}
{/await}