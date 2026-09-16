<!--
  @component 
  
  Thumbnail of the latest album, taken from the current year album in the store
-->
<script lang="ts">
    import Thumbnail from '$lib/components/site/Thumbnail.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';
    import { currentYearAlbumPath, latestAlbum } from '$lib/utils/latestAlbum';

    let thumb = $derived(latestAlbum(albumState.albums.get(currentYearAlbumPath())?.album));
</script>

{#if thumb}
    <div>
        <h2>Latest Album</h2>
        <Thumbnail
            title={thumb.title}
            summary={thumb.summary}
            href={thumb.href}
            thumbnailUrlInfo={thumb.thumbnailUrlInfo}
        />
    </div>
{/if}

<style>
    div {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.7em;
    }

    div h2 {
        font-size: 16px;
        font-weight: bold;
        color: var(--default-text-color);
    }
</style>
