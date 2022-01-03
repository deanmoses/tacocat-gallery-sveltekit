<script context="module" lang="ts">
	export async function load({ page }) {
    const year = page.params.year;
    const week = page.params.week;
    const photo = page.params.photo;
    return {props: {year, week, photo}}
  }
</script>

<script lang="ts">
  import PhotoPage from "$lib/pages/photo/PhotoPage.svelte";
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";

  export let year;
  export let week;
  export let photo;

  const albumPath = `${year}/${week}`;
  const photoPath = `${albumPath}/${photo}`
  const album = AlbumStoreHelpers.getAlbum(albumPath);
</script>

{#await AlbumStoreHelpers.fetchAlbum(albumPath)}
  LOADING
{:then}
  <PhotoPage album={album} photoPath={photoPath}/>
{:catch error}
  Error fetching album: {error}
{/await}