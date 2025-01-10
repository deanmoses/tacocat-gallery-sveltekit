<!-- 
    @component 
    
    Lays out the shell of the app 
-->
<script lang="ts">
    import { getYear } from '$lib/stores/YearStore';
    import Footer from './Footer.svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        hideFooter?: boolean;
        editControls?: Snippet;
        children?: Snippet;
    }

    let { hideFooter = false, editControls, children }: Props = $props();
    let year = $derived(getYear());
</script>

{@render editControls?.()}

<div class="site-container" data-year={$year || null}>
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
