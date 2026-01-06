<!-- 
    @component 
    
    Lays out the shell of the app 
-->
<script lang="ts">
    import { page } from '$app/state';
    import Footer from './Footer.svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        hideFooter?: boolean;
        editControls?: Snippet;
        children?: Snippet;
    }

    let { hideFooter = false, editControls, children }: Props = $props();
    let year = $derived(page.params.year || 'current');
</script>

{@render editControls?.()}

<div class="site-container" data-year={year}>
    <div class="page-container">
        {@render children?.()}
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
