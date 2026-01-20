<script lang="ts">
    import type { PageProps } from './$types';
    import MediaRouting from '$lib/components/pages/media/MediaRouting.svelte';
    import MediaPage from '$lib/components/pages/media/MediaPage.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

    let { data }: PageProps = $props();
    let albumPath = $derived(data.albumPath);
    let album = $derived(albumState.albums.get(albumPath)?.album);
    let mediaPath = $derived(data.mediaPath);
    let media = $derived(album?.getMedia(mediaPath));
</script>

<MediaRouting {albumPath} {mediaPath} {media}>
    {#snippet loaded()}
        {#if media && album}
            {#if albumState.editMode}
                {#await import('$lib/components/pages/media/MediaEditPage.svelte') then { default: MediaEditPage }}
                    <MediaEditPage {media} {album} />
                {/await}
            {:else}
                <MediaPage {media} {album} />
            {/if}
        {/if}
    {/snippet}
</MediaRouting>
