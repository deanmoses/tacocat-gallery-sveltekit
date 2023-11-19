<!--
  @component Lays out the shell of the app
-->
<script lang="ts">
    import Footer from './Footer.svelte';

    export let year: string = '';
    export let hideFooter = false;

    let dragging = false;
    $: dragging = dragging;

    function dragEnter() {
        dragging = true;
    }

    function dragLeave() {
        dragging = false;
    }
</script>

<slot name="editControls" />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    class="site-container"
    data-year={year}
    on:mouseenter={dragEnter}
    on:mouseleave={dragLeave}
    on:dragenter={dragEnter}
    on:dragleave={dragLeave}
    class:dragging
>
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

    .dragging {
        filter: grayscale(50%);
        border-width: 2px;
    }

    .page-container {
        border: var(--default-border);
    }
</style>
