
<!--
  Image edit route
-->

<script context="module" lang="ts">
	export async function load({ params }) {
		const year = params.year;
    const albumPath = `${params.year}/${params.day}`;
    const imagePath = `${albumPath}/${params.image}`
    return {
      props: {
				year,
        imagePath,
        albumEntry: albumStore.get(albumPath)
      }
    }
  }
</script>

<script lang="ts">
	import type { Readable } from "svelte/store";
	import { AlbumEntry, albumStore } from "$lib/stores/AlbumStore";
	import ImageRouting from "$lib/components/pages/image/ImageRouting.svelte";
  import ImageEditPage from "$lib/components/pages/image/ImageEditPage.svelte";
  
	export let year: string;
  export let imagePath: string;
  export let albumEntry: Readable<AlbumEntry>;
</script>

<ImageRouting status={$albumEntry.loadStatus} {year}>
	<svelte:fragment slot="loaded">
		<ImageEditPage {year} album={$albumEntry.album} image={$albumEntry.album.getImage(imagePath)} />
	</svelte:fragment>
</ImageRouting>
