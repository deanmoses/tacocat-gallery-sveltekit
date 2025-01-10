<!--
  @component Base component for all SVG icons
-->
<script lang="ts">
    import type { MouseEventHandler } from 'svelte/elements';

    interface Props {
        width?: string;
        height?: string;
        title?: string | undefined;
        d: string;
        viewBox: string;
        onclick?: MouseEventHandler<SVGSVGElement> | null;
    }

    let { width = '1em', height = '1em', title = undefined, d, viewBox, onclick }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg {onclick} {width} {height} {viewBox}>
    {#if title}<title>{title}</title>{/if}
    <path {d} />
</svg>

<style>
    svg {
        display: inline;
        position: relative;
        bottom: 0.125em;
        vertical-align: middle;
    }
    path {
        fill: currentcolor;
    }
</style>
