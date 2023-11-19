<script lang="ts">
    import CropPage from '$lib/components/pages/image/CropPage.svelte';
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    $: year = data.year;
    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: status = $albumEntry.loadStatus;
    $: imagePath = data.imagePath;
    $: image = album?.getImage(imagePath);
</script>

<ImageRouting {status} {image} {year}>
    <svelte:fragment slot="loaded">
        {#if image}
            <CropPage {year} {image} />
        {/if}
    </svelte:fragment>
</ImageRouting>
