<!--
  @component Layout for day album pages
-->
<script lang="ts">
    import SiteLayout from '$lib/components/site/SiteLayout.svelte';
    import Header from '$lib/components/site/Header.svelte';
    import Nav from '$lib/components/site/nav/Nav.svelte';
    import PageContent from '$lib/components/site/PageContent.svelte';
    import MainContent from '$lib/components/site/MainContent.svelte';
    import Thumbnails from '$lib/components/site/Thumbnails.svelte';
    import { isAdmin } from '$lib/stores/SessionStore';
    import UnpublishedIcon from '$lib/components/site/icons/UnpublishedIcon.svelte';

    export let title: string = '';
    /** Adapt layout for edit mode */
    export let edit: boolean = false;
    export let published: boolean = false;
    $: unpublished = !published;
</script>

<svelte:head>
    <title>{title}</title>
</svelte:head>

<slot name="editControls" />
<SiteLayout>
    <Header hideBottomBorder>
        <slot name="title" />
    </Header>
    <Nav>
        <slot name="nav" />
    </Nav>
    <PageContent>
        <MainContent>
            <section class="caption">
                <h2 style="display:none">Album Description</h2>
                <slot name="caption" />
            </section>
            {#if !edit && $isAdmin}
                <!-- 
                    Lazy / async / dynamic load this component.
                    It's a hint to the bundling system that this code 
                    should be put into a separate bundle so that 
                    non-admins aren't forced to load it.
                -->
                {#await import('./DayAlbumThumbnailDropZone.svelte') then { default: DayAlbumThumbnailDropZone }}
                    <DayAlbumThumbnailDropZone>
                        <slot name="thumbnails" slot="thumbnails" />
                    </DayAlbumThumbnailDropZone>
                {/await}
            {:else}
                <section>
                    <h2 style="display:none">Thumbnails</h2>
                    <Thumbnails>
                        <slot name="thumbnails" />
                    </Thumbnails>
                </section>
            {/if}
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
