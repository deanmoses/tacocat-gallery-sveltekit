<!--
  @component 
  
  A thumbnail of an image
-->
<script lang="ts">
    import { DeleteStatus, CropStatus, RenameStatus } from '$lib/models/album';
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
    let deleting: boolean = $derived(DeleteStatus.IN_PROGRESS === albumState.imageDeletes.get(path)?.status);
    let renaming: boolean = $derived(RenameStatus.IN_PROGRESS === albumState.imageRenames.get(path)?.status);
    let cropping: boolean = $derived(CropStatus.IN_PROGRESS === albumState.crops.get(path)?.status);
</script>

<Thumbnail {title} {src} {summary} {href} {deleting} {renaming} {cropping} {selectionControls} />
