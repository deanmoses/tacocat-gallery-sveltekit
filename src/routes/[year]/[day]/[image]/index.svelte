
<!--
  Image route
-->

<script context="module" lang="ts">
	export async function load({ params }) {
		const year = params.year;
    const albumPath = `${params.year}/${params.day}`;
    const imagePath = `${albumPath}/${params.image}`
    return {
      props: {
				year,
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

	export let year: string;
  export let albumPath;
  export let imagePath;
  export let album;
</script>

{#await AlbumStoreHelpers.fetchAlbum(albumPath)}
  <ImageLoadingPage {year} />
{:then}
  <ImagePage {year} album={album} image={$album.getImage(imagePath)}/>
{:catch error}
  Error fetching image: {error}
{/await}