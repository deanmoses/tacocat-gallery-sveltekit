<!--
  @component 
  
  Layout for day album pages
-->
<script lang="ts">
    import SiteLayout from '$lib/components/site/SiteLayout.svelte';
    import Header from '$lib/components/site/Header.svelte';
    import Nav from '$lib/components/site/nav/Nav.svelte';
    import PageContent from '$lib/components/site/PageContent.svelte';
    import MainContent from '$lib/components/site/MainContent.svelte';
    import Thumbnails from '$lib/components/site/Thumbnails.svelte';
    import UnpublishedIcon from '$lib/components/site/icons/UnpublishedIcon.svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        title: string;
        published: boolean;
        editControls?: Snippet;
        nav?: Snippet;
        caption?: Snippet;
        thumbnails?: Snippet;
    }

    let { title = '', published = false, editControls, nav, caption, thumbnails }: Props = $props();

    let unpublished = $derived(!published);
</script>

<svelte:head>
    <title>{title}</title>
</svelte:head>

{@render editControls?.()}
<SiteLayout>
    <Header hideBottomBorder>
        {title}
    </Header>
    <Nav>
        {@render nav?.()}
    </Nav>
    <PageContent>
        <MainContent>
            <section class="caption">
                <h2 style="display:none">Album Description</h2>
                {@render caption?.()}
            </section>
            <section>
                <h2 style="display:none">Thumbnails</h2>
                <Thumbnails>
                    {@render thumbnails?.()}
                </Thumbnails>
            </section>
            {#if unpublished}
                <div class="unpublished">
                    <UnpublishedIcon width="3em" height="3em" />
                </div>
            {/if}
        </MainContent>
    </PageContent>
</SiteLayout>

<style>
    .unpublished {
        display: flex;
        justify-content: right;
    }
</style>
