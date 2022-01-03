<script context="module" lang="ts">
	export async function load({ page }) {
    const week = page.params.week;
    const year = page.params.year;
    return {props: {week, year}}
  }
</script>

<script lang="ts">
  import AlbumLoadingPage from "$lib/pages/album/AlbumLoadingPage.svelte";
  import WeekAlbumPage from "$lib/pages/album/WeekAlbumPage.svelte";
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";

  export let week;
  export let year;
  const path = `${year}/${week}`;
  const album = AlbumStoreHelpers.getAlbum(path);
</script>

<!-- <WeekAlbumPage {week} {year} /> -->

{#await AlbumStoreHelpers.fetchAlbum(path)}
  <AlbumLoadingPage />
{:then}
  <WeekAlbumPage album={album} />
{:catch error}
  Error fetching album: {error}
{/await}