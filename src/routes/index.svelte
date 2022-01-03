<script lang="ts">
  import AlbumLoadingPage from "$lib/pages/album/AlbumLoadingPage.svelte";
  import RootAlbumPage from "$lib/pages/album/RootAlbumPage.svelte";
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";
  import { store } from "$lib/stores/store";
  import { derived } from 'svelte/store';
    
    AlbumStoreHelpers.fetchAlbum("root");

    //export const album = AlbumStoreHelpers.getAlbum();
    const album = derived(
      store,
      $store => $store.albums["root"]
    );
</script>

{#if $album.isLoading}
  <AlbumLoadingPage />
{:else}
  <RootAlbumPage album={album} />
{/if}