<!--
  @component 
  
  The main content of a page.  In an image page, that'd be the caption and image.  In an album, the thumbnails.
-->
<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children?: Snippet;
    }

    let { children }: Props = $props();
</script>

<div class="main-content">
    {@render children?.()}
</div>

<style>
    .main-content {
        flex: 3;

        display: flex;
        flex-direction: column;
        gap: calc(var(--default-padding) * 2);

        padding: calc(var(--default-padding) * 2);
        background-color: white;
    }
</style>
