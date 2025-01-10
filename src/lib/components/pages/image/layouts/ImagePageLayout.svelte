<!-- 
    @component 
    
    Layout of an image page 
-->
<script lang="ts">
    import SiteLayout from '$lib/components/site/SiteLayout.svelte';
    import Header from '$lib/components/site/Header.svelte';
    import PageContent from '$lib/components/site/PageContent.svelte';
    import Nav from '$lib/components/site/nav/Nav.svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        title: string;
        titleEditor?: Snippet;
        caption?: Snippet;
        image?: Snippet;
        nav?: Snippet;
        editControls?: Snippet;
    }

    let { title, titleEditor, caption, image, nav, editControls }: Props = $props();
</script>

<svelte:head>
    <title>{title}</title>
</svelte:head>

<SiteLayout>
    {@render editControls?.()}
    {#if titleEditor}
        <Header hideSiteTitle hideSearch hideWhenSmall>
            {@render titleEditor?.()}
        </Header>
    {:else if title}
        <Header hideSiteTitle hideSearch hideWhenSmall>
            {title}
        </Header>
    {/if}
    <PageContent>
        <div class="captionAndPhoto">
            {#if caption}
                <section class="caption">
                    <h2 style="display:none">Caption</h2>
                    {@render caption?.()}
                </section>
            {/if}
            <div class="navAndPhoto">
                {#if nav}
                    <Nav>
                        {@render nav?.()}
                    </Nav>
                {/if}
                <section>
                    <h2 style="display:none">Photo</h2>
                    {@render image?.()}
                </section>
            </div>
        </div>
    </PageContent>
</SiteLayout>

<style>
    .captionAndPhoto {
        flex: 3;

        display: flex;
        gap: calc(var(--default-padding) * 2);

        padding: calc(var(--default-padding) * 2);
        background-color: white;
    }

    @media screen and (max-width: 975px) {
        .captionAndPhoto {
            flex-direction: column;
        }
    }

    .caption {
        flex: 1;
    }

    .navAndPhoto {
        flex: 3;
    }
</style>
