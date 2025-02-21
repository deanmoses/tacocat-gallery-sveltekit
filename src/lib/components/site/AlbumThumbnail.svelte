<!--
  @component 
  
  A thumbnail of an album
-->
<script lang="ts">
    import { AlbumStatus } from '$lib/models/album';
    import { albumState } from '$lib/stores/AlbumState.svelte';
    import type { Snippet } from 'svelte';
    import Thumbnail from './Thumbnail.svelte';

    interface Props {
        path: string;
        href?: string;
        src?: string;
        title?: string;
        summary?: string;
        published?: boolean;
        selectionControls?: Snippet;
    }
    let { path, href, src, title, summary, published, selectionControls }: Props = $props();
    let status: AlbumStatus | undefined = $derived(albumState.albums.get(path)?.status);
    let creating: boolean = $derived(AlbumStatus.CREATING === status);
    let deleting: boolean = $derived(AlbumStatus.DELETING === status);
    let renaming: boolean = $derived(AlbumStatus.RENAMING === status);
</script>

<Thumbnail {title} {src} {summary} {href} {published} {deleting} {renaming} {creating} {selectionControls} />
