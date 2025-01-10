<!--
  @component 
  
  A grid of thumbnails
-->
<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children?: Snippet;
    }

    let { children }: Props = $props();
</script>

<div>
    {@render children?.()}
</div>

<style>
    div {
        display: flex;
        flex-wrap: wrap;
        gap: calc(var(--default-padding) * 2);
    }
    @media (max-width: 456px) {
        div {
            justify-content: center;
        }
    }
</style>
