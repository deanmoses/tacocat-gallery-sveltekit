<!--
  @component
  
  Show big version of an image
-->
<script lang="ts">
    import type { Image } from '$lib/models/GalleryItemInterfaces';

    interface Props {
        image: Image;
    }

    let { image }: Props = $props();
</script>

<!-- 
	When navigating between images quickly, Svelte wasn't destroying the previous
	image fast enough: you'd briefly see the old image with the new text.  
	Wrapping the image in a #key block seems to make this problem go away.
-->
{#key image.path}
    <a href={image.originalUrl} aria-label="View full-size image: {image.title}">
        <img
            src={image.detailUrl}
            style="max-width: {image.detailWidth}px; max-height: {image.detailHeight}px; aspect-ratio: {image.detailWidth} / {image.detailHeight};"
            alt={image.title}
            loading="eager"
            decoding="async"
            fetchpriority="high"
            draggable="false"
        />
    </a>
{/key}

<style>
    img {
        object-fit: contain;
        width: 100%;
        height: 100%;
        color: transparent; /* Hide alt text while image loads */
        background-color: #f0f0f0;
    }
</style>
