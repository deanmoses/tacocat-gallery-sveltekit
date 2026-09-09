<!--
  @component 
  
  Sidebar of the site
-->
<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children?: Snippet;
    }

    let { children }: Props = $props();
</script>

<aside class="hidden-sm">
    {@render children?.()}
</aside>

<style>
    aside {
        flex: 1;
        min-width: 8em;
        padding: calc(var(--default-padding) * 4) calc(var(--default-padding) * 2);
        background-color: var(--sidebar-color);
        border-right: var(--default-border);
    }
</style>
