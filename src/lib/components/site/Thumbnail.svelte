<!--
  @component 
  
  A thumbnail of an album or image
-->
<script lang="ts">
    import CreateIcon from './icons/CreateIcon.svelte';
    import CropIcon from './icons/CropIcon.svelte';
    import DeleteIcon from './icons/DeleteIcon.svelte';
    import RenameIcon from './icons/RenameIcon.svelte';
    import UnpublishedIcon from './icons/UnpublishedIcon.svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        src?: string;
        href?: string;
        title?: string;
        summary?: string;
        published?: boolean;
        creating?: boolean;
        deleting?: boolean;
        renaming?: boolean;
        cropping?: boolean;
        selectionControls?: Snippet;
    }
    let {
        src = '',
        href = '',
        title = '',
        summary = '',
        published = true,
        creating = false,
        deleting = false,
        renaming = false,
        cropping = false,
        selectionControls,
    }: Props = $props();
    let unpublished: boolean = $derived(!published);
</script>

<figure>
    <a {href} aria-hidden="true" tabindex="-1"
        >{#if src}<img {src} alt="" draggable="false" loading="lazy" decoding="async" />{:else}<div
                class="no-image"
            ></div>{/if}{#if creating}<div class="icon-overlay">
                <CreateIcon width="10em" height="10em" />
            </div>{:else if deleting}<div class="icon-overlay">
                <DeleteIcon width="10em" height="10em" />
            </div>{:else if renaming}<div class="icon-overlay">
                <RenameIcon width="7em" height="7em" />
            </div>{:else if cropping}<div class="icon-overlay">
                <CropIcon width="10em" height="10em" />
            </div>{:else if unpublished}<div class="icon-overlay">
                <UnpublishedIcon width="3em" height="3em" />
            </div>{/if}</a
    >{@render selectionControls?.()}{#if summary}<div class="summary">{summary}</div>{/if}
    <figcaption><a {href}>{title}</a></figcaption>
</figure>

<style>
    figure {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative; /* to support the absolute positioning of my child star, if any */
        margin: 0;
    }

    a {
        text-decoration: none;
        color: black;
    }

    figure > a {
        width: var(--thumbnail-width);
        height: var(--thumbnail-height);
    }

    figcaption {
        margin-top: 0.3em;
    }

    img,
    .no-image {
        width: var(--thumbnail-width);
        height: var(--thumbnail-height);
        border: var(--default-border);
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

    .summary {
        color: var(--default-text-color);
    }
</style>
