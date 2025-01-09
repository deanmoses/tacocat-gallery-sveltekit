<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<!--
  @component Put the page's content in me.  That's usually both a sidebar and the main content of page.
-->

<main>
    {@render children?.()}
</main>

<style>
    main {
        flex: 1;
        display: flex;
    }
</style>
