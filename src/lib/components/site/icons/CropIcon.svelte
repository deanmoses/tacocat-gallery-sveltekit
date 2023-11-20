<!--
  @component An icon representing the concept of "crop"
-->
<script lang="ts">
    import Icon from './Icon.svelte';

    export let width = '1em';
    export let height = '1em';
    export let title: string | undefined = undefined;

    const d = 'M6 14V1H4v3H1v2h3v8c0 1.1.899 2 2 2h8v3h2v-3h3v-2H6zm8-1h2V6c0-1.1-.899-2-2-2H7v2h7v7z';
    const viewBox = '0 -3 21 21';
</script>

<Icon on:click {width} {height} {viewBox} {title} {d} />
