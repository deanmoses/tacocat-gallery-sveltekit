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
    }

    let { width = '1em', height = '1em', title = undefined }: Props = $props();

    // Play triangle: M0,0 L100,50 L0,100 Z
    const d = 'M0 0 L100 50 L0 100 Z';
    const viewBox = '0 0 100 100';
</script>

<Icon {width} {height} {viewBox} {title} {d} />
