<!--
  @component

  The root route of the gallery
-->
<script lang="ts">
	import AlbumLoadingPage from "$lib/components/pages/album/AlbumLoadingPage.svelte";
  import RootAlbumPage from "$lib/components/pages/album/RootAlbumPage.svelte";
	import AlbumErrorPage from "$lib/components/pages/album/AlbumErrorPage.svelte";
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";
  
  const path = "root";
  const album = AlbumStoreHelpers.getAlbum(path);
</script>

{#await AlbumStoreHelpers.fetchAlbum(path)}
  <AlbumLoadingPage />
{:then}
  <RootAlbumPage album={album} />
{:catch error}
	<AlbumErrorPage>
		Error fetching album: {error}
	</AlbumErrorPage>
{/await}