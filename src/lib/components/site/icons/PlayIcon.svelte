<!--
  @component

  A play button icon (triangle pointing right)
-->
<script lang="ts">
    import Icon from './Icon.svelte';

    interface Props {
        width?: string;
        height?: string;
        title?: string;
        bottom?: string;
    }

    let { width = '1em', height = '1em', title = undefined, bottom }: Props = $props();

    // Play triangle: equilateral proportions, optically centered (shifted right ~6 units)
    // Left corners use quadratic bezier curves for rounding, right point stays sharp
    const d = 'M17 8 Q17 0 25 4 L97 50 L25 96 Q17 100 17 92 Z';
    const viewBox = '0 0 100 100';
</script>

<Icon {width} {height} {viewBox} {title} {d} {bottom} />
