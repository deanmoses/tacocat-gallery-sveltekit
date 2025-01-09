<!--
  @component An icon representing the concept of "crop"
-->
<script lang="ts">
    import Icon from './Icon.svelte';

  interface Props {
    width?: string;
    height?: string;
    title?: string | undefined;
  }

  let { width = '1em', height = '1em', title = undefined }: Props = $props();

    const d = 'M6 14V1H4v3H1v2h3v8c0 1.1.899 2 2 2h8v3h2v-3h3v-2H6zm8-1h2V6c0-1.1-.899-2-2-2H7v2h7v7z';
    const viewBox = '0 -3 21 21';
</script>

<Icon on:click {width} {height} {viewBox} {title} {d} />
