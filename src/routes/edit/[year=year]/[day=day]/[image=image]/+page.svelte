<script lang="ts">
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
    import ImageEditPage from '$lib/components/pages/image/ImageEditPage.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: albumLoadStatus = $albumEntry.loadStatus;
    $: imagePath = data.imagePath;
    $: image = album?.getImage(imagePath);
</script>

<ImageRouting {albumLoadStatus} {image}>
    <svelte:fragment slot="loaded">
        {#if image && album}
            <ImageEditPage {album} {image} />
        {/if}
    </svelte:fragment>
</ImageRouting>
