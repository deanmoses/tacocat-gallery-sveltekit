<script lang="ts">
    import AlbumLoadingPage from "$lib/pages/album/AlbumLoadingPage.svelte";
    import RootAlbumPage from "$lib/pages/album/RootAlbumPage.svelte";
    import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";
    
    AlbumStoreHelpers.fetchAlbum();

    export const album = AlbumStoreHelpers.getAlbum();
</script>

{#if $album.isLoading}
  <AlbumLoadingPage />
{:else}
  <RootAlbumPage album={album} />
{/if}