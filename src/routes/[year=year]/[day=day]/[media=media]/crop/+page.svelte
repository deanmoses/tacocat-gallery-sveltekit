<script lang="ts">
    import type { PageProps } from './$types';
    import CropPage from '$lib/components/pages/media/CropPage.svelte';
    import MediaRouting from '$lib/components/pages/media/MediaRouting.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

    let { data }: PageProps = $props();
    let albumPath = $derived(data.albumPath);
    let mediaPath = $derived(data.mediaPath);
    let media = $derived(albumState.albums.get(albumPath)?.album?.getMedia(mediaPath));
</script>

<MediaRouting {albumPath} {mediaPath} {media}>
    {#snippet loaded()}
        {#if media}
            <CropPage {media} />
        {/if}
    {/snippet}
</MediaRouting>
