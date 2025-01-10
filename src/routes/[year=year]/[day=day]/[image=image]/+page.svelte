<script lang="ts">
    import { run } from 'svelte/legacy';

    import type { PageData } from './$types';
    import { isAdmin } from '$lib/stores/SessionStore';
    import type { UploadEntry, RenameEntry, DeleteEntry } from '$lib/models/album';
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
    import ImagePage from '$lib/components/pages/image/ImagePage.svelte';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let albumEntry = $derived(data.albumEntry);
    let album = $derived($albumEntry.album);
    let albumLoadStatus = $derived($albumEntry.loadStatus);
    let imagePath = $derived(data.imagePath);
    let image = $derived(album?.getImage(imagePath));

    // Lazy load these to encourage the code bundler to put them
    // into separate bundles that non-admins don't upload
    let uploadEntry: UploadEntry | undefined = $state(undefined);
    let renameEntry: RenameEntry | undefined = $state(undefined);
    let deleteEntry: DeleteEntry | undefined = $state(undefined);
    run(() => {
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
            <ImagePage {image} {album} />
        {/if}
    {/snippet}
</ImageRouting>
