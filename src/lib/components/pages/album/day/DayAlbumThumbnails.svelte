
<script lang="ts">
	import Thumbnails from "$lib/components/site/Thumbnails.svelte";
  import Thumbnail from "$lib/components/site/Thumbnail.svelte";

	export let album;
</script>

<Thumbnails>
	{#if $album.images}
	{#each $album.images as image (image.path)}
		<Thumbnail
			title="{image.title}"
			summary="{image.customdata}"
			href="/{image.path}"
			src="https://cdn.tacocat.com{image.url_thumb}"
		/>
	{/each}
	{/if}
</Thumbnails>