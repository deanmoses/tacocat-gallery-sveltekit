<!--
  @component 
  
  Base component for all SVG icons
-->
<script lang="ts">
    interface Props {
        /** Width of the icon (default: '1em') */
        width?: string;
        /** Height of the icon (default: '1em') */
        height?: string;
        /** Accessible title for screen readers */
        title?: string;
        /** SVG path data */
        d: string;
        /** SVG viewBox attribute */
        viewBox: string;
        /**
         * Bottom offset for text baseline alignment.  Use the default '0.125em'
         * to display inline with text, use '0' for when displaying standalone.
         */
        bottom?: string;
    }

    let { width = '1em', height = '1em', title = undefined, d, viewBox, bottom = '0.125em' }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg {width} {height} {viewBox} style:bottom>
    {#if title}<title>{title}</title>{/if}
    <path {d} />
</svg>

<style>
    svg {
        display: inline;
        position: relative;
        vertical-align: middle;
    }
    path {
        fill: currentcolor;
    }
</style>
