<script lang="ts">
    import type { PageProps } from './$types';
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
    import ImagePage from '$lib/components/pages/image/ImagePage.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

    let { data }: PageProps = $props();
    let albumPath = $derived(data.albumPath);
    let album = $derived(albumState.albums.get(albumPath)?.album);
    let imagePath = $derived(data.imagePath);
    let image = $derived(album?.getImage(imagePath));
</script>

<ImageRouting {albumPath} {imagePath} {image}>
    {#snippet loaded()}
        {#if image && album}
            {#if albumState.editMode}
                {#await import('$lib/components/pages/image/ImageEditPage.svelte') then { default: ImageEditPage }}
                    <ImageEditPage {image} {album} />
                {/await}
            {:else}
                <ImagePage {image} {album} />
            {/if}
        {/if}
    {/snippet}
</ImageRouting>
