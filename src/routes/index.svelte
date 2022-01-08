<!--
  @component

  The root route of the gallery
-->
<script lang="ts">
	import AlbumLoadingPage from "$lib/components/pages/album/AlbumLoadingPage.svelte";
  import RootAlbumPage from "$lib/components/pages/album/root/RootAlbumPage.svelte";
	import AlbumErrorPage from "$lib/components/pages/album/AlbumErrorPage.svelte";
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";
  
  const pathToRootAlbum = "";
  const album = AlbumStoreHelpers.getAlbum(pathToRootAlbum);
</script>

{#await AlbumStoreHelpers.fetchAlbum(pathToRootAlbum)}
  <AlbumLoadingPage />
{:then}
  <RootAlbumPage album={album} />
{:catch error}
	<AlbumErrorPage>
		Error fetching album: {error}
	</AlbumErrorPage>
{/await}