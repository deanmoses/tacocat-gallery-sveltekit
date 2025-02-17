<!--
  @component 
  
  A thumbnail of an album or image
-->
<script lang="ts">
    import { DeleteStatus, CropStatus, RenameStatus } from '$lib/models/album';
    import { albumState } from '$lib/stores/AlbumState.svelte';
    import CropIcon from './icons/CropIcon.svelte';
    import DeleteIcon from './icons/DeleteIcon.svelte';
    import RenameIcon from './icons/RenameIcon.svelte';
    import UnpublishedIcon from './icons/UnpublishedIcon.svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        path?: string;
        src?: string;
        href?: string;
        title?: string;
        summary?: string;
        published?: boolean;
        selectionControls?: Snippet;
    }
    let {
        path = '',
        src = '',
        href = '',
        title = '',
        summary = '',
        published = true,
        selectionControls,
    }: Props = $props();

    let unpublished: boolean = $derived(!published);
    let isDeleting: boolean = $derived(albumState.imageDeletes.get(path)?.status === DeleteStatus.IN_PROGRESS);
    let isRenaming: boolean = $derived(albumState.imageRenames.get(path)?.status === RenameStatus.IN_PROGRESS);
    let isCropping: boolean = $derived(albumState.crops.get(path)?.status === CropStatus.IN_PROGRESS);
</script>

<div class="thumbnail">
    <a {href}
        ><img {src} alt={title} />{#if isDeleting}<div class="icon-overlay">
                <DeleteIcon width="10em" height="10em" />
            </div>{:else if isRenaming}<div class="icon-overlay">
                <RenameIcon width="7em" height="7em" />
            </div>{:else if isCropping}<div class="icon-overlay">
                <CropIcon width="10em" height="10em" />
            </div>{:else if unpublished}<div class="icon-overlay">
                <UnpublishedIcon width="3em" height="3em" />
            </div>{/if}</a
    ><a {href}>{title}</a>

    {@render selectionControls?.()}
    {#if summary}
        <div class="summary">{summary}</div>
    {/if}
</div>

<style>
    .thumbnail {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative; /* to support the absolute positioning of my child star, if any */
    }

    a {
        text-decoration: none;
        color: black;
    }

    a:nth-of-type(1) {
        width: var(--thumbnail-width);
        height: var(--thumbnail-height);
    }

    a:nth-of-type(2) {
        margin-top: 0.3em;
    }

    img {
        width: var(--thumbnail-width);
        height: var(--thumbnail-height);
        border: var(--default-border);
    }

    .icon-overlay {
        display: block;
        position: absolute;
        top: 0;
        right: 0;
        padding: 1em;
        color: red;
    }

    .summary {
        color: var(--default-text-color);
    }
</style>
