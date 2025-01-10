<!--
  @component 
  
  Base component for nav buttons
-->
<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        href?: string;
        title: string;
        children?: Snippet;
    }

    let { href = '', title, children }: Props = $props();

    let ariaDisabled: boolean | null = $derived(!href ? true : null);
</script>

<a {title} {href} aria-disabled={ariaDisabled}><span>{@render children?.()}</span></a>

<style>
    a {
        flex: 1;
    }

    span {
        height: 100%;

        display: flex;
        justify-content: center;
        align-items: center;
        column-gap: 0.2em;

        background-color: var(--button-color);
        color: var(--default-text-color);
        border: 1px solid #ccc;
        text-decoration: none;
        padding: 6px 12px;
    }

    a[aria-disabled] {
        background-color: white;
    }

    a[aria-disabled] span {
        color: #ccc;
        cursor: not-allowed;
        opacity: 0.65;
    }
</style>
