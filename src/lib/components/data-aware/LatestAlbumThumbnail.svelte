<!--
  @component Fetches and displays a thumbnail of the latest album
-->
<script lang="ts">
    import Thumbnail from '$lib/components/site/Thumbnail.svelte';
    import { AlbumLoadStatus } from '$lib/models/album';
    import type { Thumbable } from '$lib/models/GalleryItemInterfaces';
    import { latestAlbumThumbnailEntry } from '$lib/stores/LatestAlbumStore';

    let status: AlbumLoadStatus = $derived($latestAlbumThumbnailEntry.status);
    

    let thumb: Thumbable | undefined = $derived($latestAlbumThumbnailEntry.thumbnail);
    
</script>

{#if AlbumLoadStatus.NOT_LOADED == status}
    <!-- display nothing until it's loaded -->
{:else if AlbumLoadStatus.LOADING == status}
    <!-- display nothing until it's loaded -->
{:else if AlbumLoadStatus.ERROR_LOADING == status}
    <!-- display nothing if there's an error -->
{:else if AlbumLoadStatus.LOADED == status && !thumb}
    <!-- display nothing if album thumb is undefined -->
{:else if AlbumLoadStatus.LOADED == status && !!thumb}
    <aside>
        <h2>Latest Album</h2>
        <Thumbnail title={thumb.title} summary={thumb.summary} href={thumb.path} src={thumb.thumbnailUrl} />
    </aside>
{:else}
    <!-- display nothing if I don't understand what's going on -->
{/if}

<style>
    aside {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.7em;
    }
    aside h2 {
        font-size: 16px;
        font-weight: bold;
        color: var(--default-text-color);
    }
</style>
