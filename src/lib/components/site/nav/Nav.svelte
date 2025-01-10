<!--
  @component 
  
  For grouping a set of navigation buttons together
-->
<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children?: Snippet;
    }

    let { children }: Props = $props();
</script>

<nav>
    {@render children?.()}
</nav>

<style>
    nav {
        display: flex;
    }

    :global(.btn:nth-child(2)) {
        border-left: 1px solid #848484;
        border-right: 1px solid #848484;
    }
</style>
