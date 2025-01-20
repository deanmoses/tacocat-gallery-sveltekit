<script lang="ts">
    import type { PageProps } from './$types';
    import { isAdmin } from '$lib/stores/SessionStore';
    import type { UploadEntry, RenameEntry, DeleteEntry } from '$lib/models/album';
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
    import ImageEditPage from '$lib/components/pages/image/ImageEditPage.svelte';

    let { data }: PageProps = $props();
    let albumEntry = $derived(data.albumEntry);
    let album = $derived($albumEntry.album);
    let albumLoadStatus = $derived($albumEntry.loadStatus);
    let imagePath = $derived(data.imagePath);
    let image = $derived(album?.getImage(imagePath));

    // Lazy load these, not that it matters on the edit page,
    // but to allow copy/paste from the non-edit page
    let uploadEntry: UploadEntry | undefined = $state();
    let renameEntry: RenameEntry | undefined = $state();
    let deleteEntry: DeleteEntry | undefined = $state();
    $effect(() => {
        if ($isAdmin) {
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
    });
</script>

<ImageRouting {image} {albumLoadStatus} {uploadEntry} {renameEntry} {deleteEntry}>
    {#snippet loaded()}
        {#if image && album}
            <ImageEditPage {image} {album} />
        {/if}
    {/snippet}
</ImageRouting>
