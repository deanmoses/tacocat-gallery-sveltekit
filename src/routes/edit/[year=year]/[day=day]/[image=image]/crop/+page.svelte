<script lang="ts">
    import CropPage from '$lib/components/pages/image/CropPage.svelte';
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let albumEntry = $derived(data.albumEntry);
    let album = $derived($albumEntry.album);
    let albumLoadStatus = $derived($albumEntry.loadStatus);
    let imagePath = $derived(data.imagePath);
    let image = $derived(album?.getImage(imagePath));
</script>

<ImageRouting {albumLoadStatus} {image}>
    {#snippet loaded()}
        {#if image}
            <CropPage {image} />
        {/if}
    {/snippet}
</ImageRouting>
