<script context="module" lang="ts">
	export async function load({ page }) {
    const week = page.params.week;
    const year = page.params.year;
    return {props: {week, year}}
  }
</script>

<script lang="ts">
  import WeekAlbumPage from "$lib/pages/album/WeekAlbumPage.svelte";

  export let week;
  export let year;
</script>

<WeekAlbumPage {week} {year} />