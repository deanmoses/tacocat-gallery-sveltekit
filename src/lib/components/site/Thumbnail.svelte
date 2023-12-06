<!--
  @component A thumbnail of an album or image
-->
<script lang="ts">
    import UnpublishedIcon from './icons/UnpublishedIcon.svelte';

    export let src: string = '';
    export let href: string = '';
    export let title: string = '';
    export let summary: string = '';
    export let published: boolean = true;
    $: unpublished = !published;
</script>

<div class="thumbnail">
    <a {href}
        ><img {src} alt={title} />{#if unpublished}<div class="unpublished">
                <UnpublishedIcon width="3em" height="3em" />
            </div>{/if}</a
    ><a {href}>{title}</a>

    <slot name="selectionControls" />
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

    .unpublished {
        display: block;
        position: absolute;
        top: 0;
        right: 0;
        padding: 1em;
    }

    .summary {
        color: var(--default-text-color);
    }
</style>
