<script context="module" lang="ts">
	export async function load({ page }) {
    const year = page.params.year;
    return {props: {year}}
  }
</script>

<script lang="ts">
    import AlbumLoadingPage from "$lib/pages/album/AlbumLoadingPage.svelte";
    import YearAlbumPage from "$lib/pages/album/YearAlbumPage.svelte";
    import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";

    export let year;

    const album = AlbumStoreHelpers.getAlbum(year);
</script>

{#await AlbumStoreHelpers.fetchAlbum(year)}
  <AlbumLoadingPage />
{:then}
  <YearAlbumPage album={album} />
{:catch error}
  Error fetching album: {error}
{/await}