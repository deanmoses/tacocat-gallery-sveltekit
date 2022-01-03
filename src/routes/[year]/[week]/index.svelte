<script context="module" lang="ts">
	export async function load({ page }) {
    const year = page.params.year;
    const week = page.params.week;
    return {props: {year, week}}
  }
</script>

<script lang="ts">
  import AlbumLoadingPage from "$lib/pages/album/AlbumLoadingPage.svelte";
  import WeekAlbumPage from "$lib/pages/album/WeekAlbumPage.svelte";
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";

  export let year;
  export let week;
  const path = `${year}/${week}`;
  const album = AlbumStoreHelpers.getAlbum(path);
</script>

{#await AlbumStoreHelpers.fetchAlbum(path)}
  <AlbumLoadingPage />
{:then}
  <WeekAlbumPage album={album} />
{:catch error}
  Error fetching album: {error}
{/await}