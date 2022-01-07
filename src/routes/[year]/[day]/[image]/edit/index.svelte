
<!--
  Image edit route
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
  import ImageEditPage from "$lib/components/pages/image/ImageEditPage.svelte";
	import ImageErrorPage from "$lib/components/pages/image/ImageErrorPage.svelte";
  
	export let year: string;
  export let albumPath: string;
  export let imagePath: string;
  export let album;
</script>

{#await AlbumStoreHelpers.fetchAlbum(albumPath)}
	<ImageLoadingPage {year} />
{:then}
	<ImageEditPage {year} album={album} image={$album.getImage(imagePath)}/>
{:catch error}
	<ImageErrorPage {year}>
		Error fetching image: {error}
	</ImageErrorPage>
{/await}
