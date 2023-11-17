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
    import { page } from '$app/stores';
    import { upload } from '$lib/stores/UploadStore';

    export let year: string;
    export let title: string = '';

    function dragEnter(e: DragEvent) {
        if (!(e.target instanceof HTMLElement)) return;
        e.target.classList.add('dragging');
    }

    function dragLeave(e: DragEvent) {
        if (!(e.target instanceof HTMLElement)) return;
        e.target.classList.remove('dragging');
    }

    function dragOver(e: DragEvent) {
        e.preventDefault(); // Prevent default behavior, browser opening the files
    }

    async function drop(e: DragEvent) {
        e.preventDefault(); // Prevent default behavior, browser opening the files
        if (e.target instanceof HTMLElement) e.target.classList.remove('dragging');
        if (!e.dataTransfer) {
            console.log('No dataTransfer');
            return;
        }

        let files: File[] = [];
        if (e.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            [...e.dataTransfer.items].forEach((item) => {
                // If dropped items aren't files, reject them
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file) {
                        files.push(file);
                    } else {
                        console.log(`There warn't no file name in ${file}`);
                    }
                }
            });
        } else {
            // Use DataTransfer interface to access the file(s)
            [...e.dataTransfer.files].forEach((file) => {
                files.push(file);
            });
        }
        const albumPath = $page.url.pathname + '/';
        await upload(files, albumPath);
    }
</script>

<svelte:head>
    <title>{title}</title>
</svelte:head>

<slot name="editControls" />
<SiteLayout {year}>
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
                draggable="true"
                on:dragenter={dragEnter}
                on:dragleave={dragLeave}
                on:drop={drop}
                on:dragover={dragOver}
                role="list"
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
    :global(.dragging) {
        background-color: pink;
    }
</style>
