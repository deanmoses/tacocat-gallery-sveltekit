<!--
  @component 
  
  Put the page's content in me.  That's usually both a sidebar and the main content of page.
-->
<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children?: Snippet;
    }

    let { children }: Props = $props();
</script>

<main>
    {@render children?.()}
</main>

<style>
    main {
        flex: 1;
        display: flex;
    }
</style>
