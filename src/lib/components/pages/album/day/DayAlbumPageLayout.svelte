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
            for (const item of e.dataTransfer.items) {
                const itemEntry = item.webkitGetAsEntry();
                if (itemEntry?.isDirectory) {
                    const x = await getFilesInDirectory(itemEntry as FileSystemDirectoryEntry);
                    files = files.concat(x);
                } else if (itemEntry?.isFile) {
                    console.log('Got a file not a folder', item);
                    const file = item.getAsFile();
                    if (file) {
                        //console.log(`Adding file [${file.name}] of type [${file.type}]`);
                        files.push(file);
                    } else {
                        console.log(`There warn't no file name in ${file}`);
                    }
                } else {
                    console.log(`unrecognized type of file`, item, itemEntry);
                }
            }
        } else {
            // Use DataTransfer interface to access the file(s)
            [...e.dataTransfer.files].forEach((file) => {
                files.push(file);
            });
        }
        console.log(`I'll upload [${files.length}] images`);
        const albumPath = $page.url.pathname + '/';
        await upload(files, albumPath);
    }

    /**
     * Get all the File objects in a directory
     */
    async function getFilesInDirectory(directory: FileSystemDirectoryEntry): Promise<File[]> {
        let files: File[] = [];
        const entries = await readAllDirectoryEntries(directory);
        for (const entry of entries) {
            if (entry.isFile) {
                //console.log(`Directory item`, entry);
                const fileEntry = entry as FileSystemFileEntry;
                const file = await readEntryContentAsync(fileEntry);
                //console.log(`Adding file [${file.name}] of type [${file.type}]`);
                files.push(file);
            } else {
                console.log(`Directory item is not a file`, entry);
            }
        }
        return files;
    }

    /**
     * Read all the entries in a directory
     */
    const readAllDirectoryEntries = async (directory: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> => {
        const directoryReader = directory.createReader();

        // To read all files in a directory, readEntries needs to be called
        // repeatedly until it returns an empty array.  Chromium-based
        // browsers will only return a max of 100 entries per call
        let entries = [];
        let readEntries = await readEntriesPromise(directoryReader);
        while (readEntries.length > 0) {
            entries.push(...readEntries);
            readEntries = await readEntriesPromise(directoryReader);
        }
        return entries;
    };

    /**
     * Wrap FileSystemDirectoryReader.readEntries() in a promise to enable using await
     */
    const readEntriesPromise = async (directoryReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
        return await new Promise((resolve, reject) => {
            directoryReader.readEntries(resolve, reject);
        });
    };

    /**
     * Wrap FileSystemFileEntry.file() in a promise to enable using await
     */
    const readEntryContentAsync = async (entry: FileSystemFileEntry): Promise<File> => {
        return new Promise((resolve, reject) => {
            entry.file(resolve, reject);
        });
    };
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
