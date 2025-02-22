<!--
  @component 
  
  A thumbnail of an image
-->
<script lang="ts">
    import { ImageStatus } from '$lib/models/album';
    import { albumState } from '$lib/stores/AlbumState.svelte';
    import type { Snippet } from 'svelte';
    import Thumbnail from './Thumbnail.svelte';

    interface Props {
        path: string;
        href?: string;
        src?: string;
        title?: string;
        summary?: string;
        selectionControls?: Snippet;
    }
    let { path, href, src, title, summary, selectionControls }: Props = $props();
    let status: ImageStatus | undefined = $derived(albumState.images.get(path)?.status);
    let deleting: boolean = $derived(ImageStatus.DELETING === status);
    let renaming: boolean = $derived(ImageStatus.RENAMING === status);
    let cropping: boolean = $derived(ImageStatus.CROPPING === status);
</script>

<Thumbnail {title} {src} {summary} {href} {deleting} {renaming} {cropping} {selectionControls} />
