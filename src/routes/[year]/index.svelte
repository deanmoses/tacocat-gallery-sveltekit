<script context="module" lang="ts">
	export async function load({ page }) {
        const year = page.params.year;
        return {props: {year}}
    }
</script>

<script lang="ts">
    import type { Album } from "$lib/models/models";
    import AlbumLoadingPage from "$lib/pages/album/AlbumLoadingPage.svelte";
    import YearAlbumPage from "$lib/pages/album/YearAlbumPage.svelte";
    import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";
    import { store } from "$lib/stores/store";
    import { derived } from 'svelte/store'

    export let year;

    AlbumStoreHelpers.fetchAlbum(year);

    //export const album = AlbumStoreHelpers.getAlbum();
    const album = derived(
      store,
      $store => $store.albums[year]
    );
</script>
{#if $album.isLoading}
  <AlbumLoadingPage />
{:else}
  <YearAlbumPage album={album} />
{/if}