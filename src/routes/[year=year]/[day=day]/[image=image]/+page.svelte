<script lang="ts">
    import type { PageData } from './$types';
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
    import ImagePage from '$lib/components/pages/image/ImagePage.svelte';

    export let data: PageData;

    $: imageEntry = data.imageEntry;
    $: image = $imageEntry?.image;
    $: album = $imageEntry?.albumEntry?.album;
    $: albumLoadStatus = $imageEntry?.albumEntry?.loadStatus;
</script>

<ImageRouting {albumLoadStatus} {image}>
    <svelte:fragment slot="loaded">
        {#if image && album}
            <ImagePage {image} {album} />
        {/if}
    </svelte:fragment>
</ImageRouting>
