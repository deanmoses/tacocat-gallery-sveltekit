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
    import { dropImages } from '$lib/stores/UploadStore';

    export let title: string = '';

    let dragging = false;
    $: dragging = dragging;

    function dragEnter(e: DragEvent) {
        if (e.dataTransfer?.types.includes('Files')) {
            e.preventDefault();
            dragging = true;
        }
    }

    function dragOver(e: DragEvent) {
        if (e.dataTransfer?.types.includes('Files')) {
            e.preventDefault();
        }
    }

    function dragLeave(e: DragEvent) {
        if (e.dataTransfer?.types.includes('Files')) {
            dragging = false;
        }
    }

    async function drop(e: DragEvent) {
        if (e.dataTransfer?.types.includes('Files')) {
            e.preventDefault();
            dragging = false;
            await dropImages(e);
        }
    }
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
            <section
                role="list"
                on:dragenter|preventDefault={dragEnter}
                on:dragover|preventDefault={dragOver}
                on:dragleave|preventDefault={dragLeave}
                on:drop|preventDefault={drop}
                class:dragging
            >
                <h2 style="display:none">Thumbnails</h2>
                <Thumbnails>
                    <slot name="thumbnails" />
                </Thumbnails>
            </section>
        </MainContent>
    </PageContent>
</SiteLayout>

<style>
    .dragging {
        filter: grayscale(50%) brightness(1.1);
        min-height: 100%;
    }
</style>
