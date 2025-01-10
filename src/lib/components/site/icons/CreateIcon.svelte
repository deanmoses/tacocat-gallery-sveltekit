<!--
  @component 
  
  An icon representing the concept of "create" or "add"
-->
<script lang="ts">
    import Icon from './Icon.svelte';

    interface Props {
        width?: string;
        height?: string;
        title?: string;
    }

    let { width = '1em', height = '1em', title = undefined }: Props = $props();

    const d = 'M10 1.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8zm5 9.4h-4v4H9v-4H5V9h4V5h2v4h4v2z';
    const viewBox = '-1 -3 22 22';
    // const d =
    //     'M16 10c0 .553-.048 1-.601 1H11v4.399c0 .552-.447.601-1 .601-.553 0-1-.049-1-.601V11H4.601C4.049 11 4 10.553 4 10c0-.553.049-1 .601-1H9V4.601C9 4.048 9.447 4 10 4c.553 0 1 .048 1 .601V9h4.399c.553 0 .601.447.601 1z';
    // const viewBox = '0 0 20 15';
</script>

<Icon {width} {height} {viewBox} {title} {d} />
