<!--
  @component 
  
  Base for all buttons on the edit control strip
-->
<script lang="ts">
    import { createBubbler } from 'svelte/legacy';
    import type { Snippet } from 'svelte';

    const bubble = createBubbler();

    interface Props {
        disabled?: boolean;
        /** Alt text*/
        title?: string | undefined;
        children?: Snippet;
    }

    let { disabled = false, title = undefined, children }: Props = $props();
</script>

<button onclick={bubble('click')} {disabled} {title} type="button">{@render children?.()}</button>

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
