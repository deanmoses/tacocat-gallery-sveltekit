<!--
  @component An image cropper
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import type { Image } from '$lib/models/GalleryItemInterfaces';
    export let image: Image;

    let canvas: HTMLCanvasElement;
    let img: HTMLImageElement;

    onMount(() => {
        img = new Image();
        img.src = image.detailUrl;
        img.onload = () => {
            console.log(`Image loaded`);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
        };
    });
</script>

<canvas
    bind:this={canvas}
    width={image.width}
    height={image.height}
    style="max-width: {image.width}px; max-height: {image.height}px;"
/>
