<!--
  @component

  A filled-in star icon
-->
<script lang="ts">
    export let width = '1em';
    export let height = '1em';

    const d =
        'M454 372L585 19q7-19 17.5-19T620 19l129 353h421q21 0 24 8.5t-14 20.5L838 650l130 401q7 20-.5 25.5T943 1070L600 824l-342 247q-17 12-24.5 6.5t-.5-25.5l130-400L16 401q-17-12-14-20.5t23-8.5h429z';
    const viewBox = '0 0 1196 1081.166748046875';
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<svg on:click {width} {height} {viewBox}><path {d} /></svg>

<style>
    path {
        fill: currentColor;
    }
</style>
