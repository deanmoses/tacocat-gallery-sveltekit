<!--
  @component 
  
  Base for all buttons on the edit control strip
-->
<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        disabled?: boolean;
        /** Alt text*/
        title?: string;
        children?: Snippet;
        onclick?: (event: MouseEvent) => void;
    }

    let { disabled = false, title = undefined, children, onclick }: Props = $props();
</script>

<button {onclick} {disabled} {title} type="button">{@render children?.()}</button>

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
