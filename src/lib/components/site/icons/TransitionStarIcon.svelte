<!--
  @component 
  
  An icon meant to represent a transition between an unselected star to a selected star
-->
<script lang="ts">
    interface Props {
        onclick?: (event: MouseEvent) => void;
    }

    let { onclick }: Props = $props();

    const d =
        'M454 372L585 19q7-19 17.5-19T620 19l129 353h421q21 0 24 8.5t-14 20.5L838 650l130 401q7 20-.5 25.5T943 1070L600 824l-342 247q-17 12-24.5 6.5t-.5-25.5l130-400L16 401q-17-12-14-20.5t23-8.5h429zm70 100H284l197 142-74 226 193-139 195 140-74-229 192-140H679l-78-211z';
    const viewBox = '0 0 1196 1081.166748046875';
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg {onclick} {viewBox}><path {d} /></svg>

<style>
    svg {
        animation: grow 1400ms;
    }

    @keyframes grow {
        0% {
            height: 1em;
            width: 1em;
        }
        100% {
            height: 2em;
            width: 2em;
        }
    }

    path {
        fill: currentcolor;
    }
</style>
