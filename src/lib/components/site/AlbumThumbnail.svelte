<!--
  @component

  A thumbnail of an album
-->
<script lang="ts">
    import { CreateStatus, DeleteStatus, RenameStatus } from '$lib/models/album';
    import { albumState } from '$lib/stores/AlbumState.svelte';
    import type { ThumbnailUrlInfo } from '$lib/models/GalleryItemInterfaces';
    import type { Snippet } from 'svelte';
    import Thumbnail from './Thumbnail.svelte';

    interface Props {
        path: string;
        href?: string;
        thumbnailUrlInfo?: ThumbnailUrlInfo;
        title?: string;
        summary?: string;
        published?: boolean;
        selectionControls?: Snippet;
    }
    let { path, href, thumbnailUrlInfo, title, summary, published, selectionControls }: Props = $props();
    let creating: boolean = $derived(CreateStatus.IN_PROGRESS === albumState.albumCreates.get(path)?.status);
    let deleting: boolean = $derived(DeleteStatus.IN_PROGRESS === albumState.albumDeletes.get(path)?.status);
    let renaming: boolean = $derived(RenameStatus.IN_PROGRESS === albumState.albumRenames.get(path)?.status);
</script>

<Thumbnail
    {title}
    {thumbnailUrlInfo}
    {summary}
    {href}
    {published}
    {deleting}
    {renaming}
    {creating}
    {selectionControls}
/>
