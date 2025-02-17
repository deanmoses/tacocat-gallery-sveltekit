<script lang="ts">
    import type { PageProps } from './$types';
    import CropPage from '$lib/components/pages/image/CropPage.svelte';
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
    import { albumStore } from '$lib/stores/AlbumStore.svelte';

    let { data }: PageProps = $props();
    let albumPath = $derived(data.albumPath);
    let albumEntry = $derived(albumStore.albums.get(albumPath));
    let album = $derived(albumEntry?.album);
    let albumLoadStatus = $derived(albumEntry?.loadStatus);
    let imagePath = $derived(data.imagePath);
    let image = $derived(album?.getImage(imagePath));
</script>

<ImageRouting {imagePath} {image} {albumLoadStatus}>
    {#snippet loaded()}
        {#if image}
            <CropPage {image} />
        {/if}
    {/snippet}
</ImageRouting>
