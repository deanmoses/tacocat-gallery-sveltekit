<!--
  @component Lays out the shell of the app
-->
<script lang="ts">
    import Footer from './Footer.svelte';

    export let year: string = '';
    export let hideFooter = false;
</script>

<slot name="editControls" />

<div class="site-container" data-year={year}>
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
