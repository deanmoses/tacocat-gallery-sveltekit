<script lang="ts">
    import type { PageProps } from './$types';
    import CropPage from '$lib/components/pages/image/CropPage.svelte';
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

    let { data }: PageProps = $props();
    let albumPath = $derived(data.albumPath);
    let imagePath = $derived(data.imagePath);
    let image = $derived(albumState.albums.get(albumPath)?.album?.getImage(imagePath));
</script>

<ImageRouting {albumPath} {imagePath} {image}>
    {#snippet loaded()}
        {#if image}
            <CropPage {image} />
        {/if}
    {/snippet}
</ImageRouting>
