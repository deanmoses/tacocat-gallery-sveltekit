<script lang="ts">
    import type { PageData } from './$types';
    import { isAdmin } from '$lib/stores/SessionStore';
    import type { UploadEntry, RenameEntry, DeleteEntry } from '$lib/models/album';
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
    import ImageEditPage from '$lib/components/pages/image/ImageEditPage.svelte';

    export let data: PageData;

    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: albumLoadStatus = $albumEntry.loadStatus;
    $: imagePath = data.imagePath;
    $: image = album?.getImage(imagePath);

    // Lazy load these, not that it matters on the edit page,
    // but to allow copy/paste from the non-edit page
    let uploadEntry: UploadEntry | undefined = undefined;
    let renameEntry: RenameEntry | undefined = undefined;
    let deleteEntry: DeleteEntry | undefined = undefined;
    $: if ($isAdmin) {
        import('$lib/stores/UploadStore').then(({ getUpload }) => {
            if (!imagePath) return;
            getUpload(imagePath).subscribe((entry) => {
                uploadEntry = entry;
            });
        });
        import('$lib/stores/ImageRenameStore').then(({ getImageRenameEntry }) => {
            if (!imagePath) return;
            getImageRenameEntry(imagePath).subscribe((entry) => {
                renameEntry = entry;
            });
        });
        import('$lib/stores/ImageDeleteStore').then(({ getImageDeleteEntry }) => {
            if (!imagePath) return;
            getImageDeleteEntry(imagePath).subscribe((entry) => {
                deleteEntry = entry;
            });
        });
    }
</script>

<ImageRouting {image} {albumLoadStatus} {uploadEntry} {renameEntry} {deleteEntry}>
    <svelte:fragment slot="loaded">
        {#if image && album}
            <ImageEditPage {image} {album} />
        {/if}
    </svelte:fragment>
</ImageRouting>
