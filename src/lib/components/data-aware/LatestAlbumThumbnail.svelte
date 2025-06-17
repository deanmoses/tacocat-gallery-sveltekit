<!--
  @component 
  
  Fetches and displays a thumbnail of the latest album
-->
<script lang="ts">
    import Thumbnail from '$lib/components/site/Thumbnail.svelte';
    import type { Thumbable } from '$lib/models/GalleryItemInterfaces';
    import { latestAlbumLoadMachine } from '$lib/state/LatestAlbumLoadMachine.svelte';
    import { onMount } from 'svelte';

    let thumb: Thumbable | undefined = $derived(latestAlbumLoadMachine.entry.thumbnail);

    onMount(() => {
        latestAlbumLoadMachine.fetch();
    });
</script>

{#if thumb}
    <aside>
        <h2>Latest Album</h2>
        <Thumbnail title={thumb.title} summary={thumb.summary} href={thumb.path} src={thumb.thumbnailUrl} />
    </aside>
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
