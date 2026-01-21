<!--
  @component

  A thumbnail of an album or image/video
-->
<script lang="ts">
    import CreateIcon from './icons/CreateIcon.svelte';
    import CropIcon from './icons/CropIcon.svelte';
    import DeleteIcon from './icons/DeleteIcon.svelte';
    import PlayButtonIcon from './icons/PlayButtonIcon.svelte';
    import RenameIcon from './icons/RenameIcon.svelte';
    import UnpublishedIcon from './icons/UnpublishedIcon.svelte';
    import { thumbnailUrl } from '$lib/utils/config';
    import type { ThumbnailUrlInfo } from '$lib/models/GalleryItemInterfaces';
    import type { Snippet } from 'svelte';

    interface Props {
        /** Data needed to construct thumbnail URL */
        thumbnailUrlInfo?: ThumbnailUrlInfo;
        /** Direct src URL (used by UploadThumbnail for blob URLs) */
        src?: string;
        /** Where the thumbnail links to */
        href?: string;
        title?: string;
        summary?: string;
        published?: boolean;
        creating?: boolean;
        deleting?: boolean;
        renaming?: boolean;
        cropping?: boolean;
        /** Whether this thumbnail represents a video */
        isVideo?: boolean;
        selectionControls?: Snippet;
    }
    let {
        thumbnailUrlInfo,
        src = '',
        href = '',
        title = '',
        summary = '',
        published = true,
        creating = false,
        deleting = false,
        renaming = false,
        cropping = false,
        isVideo = false,
        selectionControls,
    }: Props = $props();

    // Build thumbnail URL from thumbnailUrlInfo if provided, else use src directly
    let imgSrc: string = $derived(
        thumbnailUrlInfo
            ? thumbnailUrl(thumbnailUrlInfo.imagePath, thumbnailUrlInfo.versionId, thumbnailUrlInfo.crop)
            : src,
    );
    let unpublished: boolean = $derived(!published);
    let imageLoaded = $state(false);
</script>

<div class="thumbnail">
    <a {href} aria-hidden="true" tabindex="-1"
        >{#if imgSrc}<img
                src={imgSrc}
                alt=""
                draggable="false"
                decoding="async"
                onload={() => (imageLoaded = true)}
            />{:else}<div class="no-image"></div>{/if}{#if creating}<div class="icon-overlay">
                <CreateIcon width="10em" height="10em" />
            </div>{:else if deleting}<div class="icon-overlay">
                <DeleteIcon width="10em" height="10em" />
            </div>{:else if renaming}<div class="icon-overlay">
                <RenameIcon width="7em" height="7em" />
            </div>{:else if cropping}<div class="icon-overlay">
                <CropIcon width="10em" height="10em" />
            </div>{:else if unpublished}<div class="icon-overlay">
                <UnpublishedIcon width="3em" height="3em" />
            </div>{/if}{#if isVideo && imageLoaded}<div class="play-overlay">
                <PlayButtonIcon size="3em" />
            </div>{/if}</a
    ><a {href}>{title}</a>
    {@render selectionControls?.()}
    {#if summary}<div class="summary">{summary}</div>{/if}
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
        max-width: var(--thumbnail-width);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    img,
    .no-image {
        width: var(--thumbnail-width);
        height: var(--thumbnail-height);
        border: var(--default-border);
        object-fit: cover;
    }

    .no-image {
        background-color: #f0f0f0;
    }

    .icon-overlay {
        display: block;
        position: absolute;
        top: 0;
        right: 0;
        padding: 1em;
        color: red;
    }

    .play-overlay {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        color: rgba(255, 255, 255, 0.85);
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        pointer-events: none;
    }

    .summary {
        color: var(--default-text-color);
    }
</style>
