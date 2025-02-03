<script lang="ts">
    import type { PageProps } from './$types';
    import type { UploadEntry, RenameEntry, DeleteEntry } from '$lib/models/album';
    import ImageRouting from '$lib/components/pages/image/ImageRouting.svelte';
    import ImagePage from '$lib/components/pages/image/ImagePage.svelte';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';
    import { albumStore } from '$lib/stores/AlbumStore.svelte';

    let { data }: PageProps = $props();
    let albumPath = $derived(data.albumPath);
    let albumEntry = $derived(albumStore.albums.get(albumPath));
    let album = $derived(albumEntry?.album);
    let albumLoadStatus = $derived(albumEntry?.loadStatus);
    let imagePath = $derived(data.imagePath);
    let image = $derived(album?.getImage(imagePath));
    let isAdmin = $derived(sessionStore.isAdmin);

    let uploadEntry: ReadonlyArray<UploadEntry> | undefined = $derived.by(() => {
        imagePath; // triggers re-executing this derivation
        if (isAdmin)
            // Lazy load to encourage code bundler to put it into separate bundle that non-admins don't upload
            import('$lib/stores/UploadStore.svelte').then(({ uploadStore }) => {
                if (imagePath) return uploadStore.getUpload(imagePath);
            });
        return undefined;
    });

    let deleteEntry: DeleteEntry | undefined = $derived.by(() => {
        imagePath; // triggers re-executing this derivation
        if (isAdmin)
            // Lazy load to encourage code bundler to put it into separate bundle that non-admins don't upload
            import('$lib/stores/ImageDeleteStore.svelte').then(({ imageDeleteStore }) => {
                if (imagePath) return imageDeleteStore.deletes.get(imagePath);
            });
        return undefined;
    });

    let renameEntry: RenameEntry | undefined = $derived.by(() => {
        imagePath; // triggers re-executing this derivation
        if (isAdmin)
            // Lazy load to encourage code bundler to put it into separate bundle that non-admins don't upload
            import('$lib/stores/ImageRenameStore.svelte').then(({ imageRenameStore }) => {
                if (imagePath) return imageRenameStore.renames.get(imagePath);
            });
        return undefined;
    });
</script>

<ImageRouting {image} {albumLoadStatus} {uploadEntry} {renameEntry} {deleteEntry}>
    {#snippet loaded()}
        {#if image && album}
            <ImagePage {image} {album} />
        {/if}
    {/snippet}
</ImageRouting>
