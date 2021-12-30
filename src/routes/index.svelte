<script lang="ts">
    import AlbumLoadingPage from "$lib/pages/album/AlbumLoadingPage.svelte";
    import RootAlbumPage from "$lib/pages/album/RootAlbumPage.svelte";
    import { store } from '$lib/stores/store';
    import { derived } from 'svelte/store';

    export const album = derived(
      store,
      $store => $store.album
    );

    // Test of making something reactive
    // Does the presentation component actually update every second?
    setInterval(() => {
      store.actions.setDate(new Date());
    }, 1000);

    // Mock out loading the album
    setTimeout(function (loading) {
      store.actions.setLoaded();
    }, 550);
</script>

{#if $album.isLoading}
  <AlbumLoadingPage />
{:else}
  <RootAlbumPage album={album} />
{/if}