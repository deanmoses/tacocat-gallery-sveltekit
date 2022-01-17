<!--
  @component

  The full page image on the image page
-->

<script lang="ts">
	import type { Image } from "$lib/models/album";
	import Config from "$lib/utils/config";
	
	export let image: Image;
</script>

<a href={Config.fullSizeImageUrl(image.path)} target="zen">
	<img 
		src={Config.cdnUrl(image.url_sized)} 
		style="max-width: {image.width}px; max-height: {image.height}px;" 
		alt={image.title}
	/>
</a>

<style>
	img {
		object-fit: contain;
		width: 100%;
		height: 100%;
	}
</style>