<!--
  @component 
  
  An icon representing the concept of "rename"
-->
<script lang="ts">
    import Icon from './Icon.svelte';

    interface Props {
        width?: string;
        height?: string;
        title?: string;
    }

    let { width = '0.85em', height = '1.2em', title = undefined }: Props = $props();

    const d =
        'M18.174 1.826c-1.102-1.102-2.082-.777-2.082-.777L7.453 9.681 6 14l4.317-1.454 8.634-8.638s.324-.98-.777-2.082zm-7.569 9.779l-.471.47-1.473.5a2.216 2.216 0 0 0-.498-.74 2.226 2.226 0 0 0-.74-.498l.5-1.473.471-.47s.776-.089 1.537.673c.762.761.674 1.538.674 1.538zM16 17H3V4h5l2-2H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2v-7l-2 2v5z';
    const viewBox = '0 0 20 13';
</script>

<Icon {width} {height} {viewBox} {title} {d} />
