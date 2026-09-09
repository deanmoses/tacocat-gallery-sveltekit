<!--
  @component 
  
  Layout for year album pages
-->
<script lang="ts">
    import SiteLayout from '$lib/components/site/SiteLayout.svelte';
    import Header from '$lib/components/site/Header.svelte';
    import Nav from '$lib/components/site/nav/Nav.svelte';
    import PageContent from '$lib/components/site/PageContent.svelte';
    import Sidebar from '$lib/components/site/Sidebar.svelte';
    import MainContent from '$lib/components/site/MainContent.svelte';
    import { page } from '$app/state';
    import type { Snippet } from 'svelte';

    interface Props {
        editControls?: Snippet;
        nav?: Snippet;
        caption?: Snippet;
        thumbnails?: Snippet;
    }

    let { editControls, nav, caption, thumbnails }: Props = $props();

    let year = $derived(page.params.year || '');

    const editControls_render = $derived(editControls);
</script>

<svelte:head>
    <title>{year}</title>
</svelte:head>

<SiteLayout>
    {#snippet editControls()}
        {@render editControls_render?.()}
    {/snippet}
    <Header hideBottomBorder>
        {year}
    </Header>
    <Nav>
        {@render nav?.()}
    </Nav>
    <PageContent>
        <Sidebar>
            <section class="caption" aria-label="Year in review">
                {@render caption?.()}
            </section>
        </Sidebar>
        <MainContent>
            <section class="months" aria-label="Thumbnails">
                {@render thumbnails?.()}
            </section>
        </MainContent>
    </PageContent>
</SiteLayout>

<style>
    .months {
        display: flex;
        flex-direction: column;
        gap: calc(var(--default-padding) * 2);
    }
</style>
