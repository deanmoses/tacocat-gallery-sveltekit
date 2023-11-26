<script lang="ts">
    import CropPage from '$lib/components/pages/image/CropPage.svelte';
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
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
        {#if image}
            <CropPage {image} />
        {/if}
    </svelte:fragment>
</ImageRouting>
