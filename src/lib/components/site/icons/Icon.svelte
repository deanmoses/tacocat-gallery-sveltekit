<!--
  @component 
  
  Base component for all SVG icons
-->
<script lang="ts">
    interface Props {
        width?: string;
        height?: string;
        title?: string;
        d: string;
        viewBox: string;
    }

    let { width = '1em', height = '1em', title = undefined, d, viewBox }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg {width} {height} {viewBox}>
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
