<!--
  @component

  Layout of an image page.
-->

<script lang="ts">
    import SiteLayout from '$lib/components/site/SiteLayout.svelte';
    import Header from '$lib/components/site/Header.svelte';
    import PageContent from '$lib/components/site/PageContent.svelte';
    import Nav from '$lib/components/site/nav/Nav.svelte';

    export let year: string;
    export let title: string;
</script>

<svelte:head>
    <title>{title}</title>
</svelte:head>

<SiteLayout {year}>
    <svelte:fragment slot="editControls"><slot name="editControls" /></svelte:fragment>
    <Header hideSiteTitle hideSearch hideWhenSmall>
        <slot name="title" />
    </Header>
    <PageContent>
        <div class="captionAndPhoto">
            <section class="caption">
                <h2 style="display:none">Caption</h2>
                <slot name="caption" />
            </section>
            <div class="navAndPhoto">
                <Nav>
                    <slot name="nav" />
                </Nav>
                <section>
                    <h2 style="display:none">Photo</h2>
                    <slot name="image" />
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
