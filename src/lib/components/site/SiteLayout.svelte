<!--
  @component Lays out the shell of the app
-->
<script lang="ts">
    import { getYear } from '$lib/stores/YearStore';
    import Footer from './Footer.svelte';

    export let hideFooter = false;
    $: year = getYear();
</script>

<slot name="editControls" />

<div class="site-container" data-year={$year || null}>
    <div class="page-container">
        <slot />
    </div>
    {#if !hideFooter}<Footer />{/if}
</div>

<style>
    .site-container {
        min-height: 100%;
        background-color: var(--body-color);
        padding: 0.7em;
    }

    .page-container {
        border: var(--default-border);
    }
</style>
