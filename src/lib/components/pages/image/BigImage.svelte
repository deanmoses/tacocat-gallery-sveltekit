<!--
  @component Show big version of an image
-->
<script lang="ts">
    import type { Image } from '$lib/models/GalleryItemInterfaces';

    export let image: Image;
</script>

<!-- 
	When navigating between images quickly, Svelte wasn't destroying the previous
	image fast enough: you'd briefly see the old image with the new text.  
	Wrapping the image in a #key block seems to make this problem go away.
-->
{#key image.path}
    <a href={image.originalUrl}>
        <img
            src={image.detailUrl}
            style="max-width: {image.detailWidth}px; max-height: {image.detailHeight}px;"
            alt={image.title}
        />
    </a>
{/key}

<style>
    img {
        object-fit: contain;
        width: 100%;
        height: 100%;
    }
</style>
