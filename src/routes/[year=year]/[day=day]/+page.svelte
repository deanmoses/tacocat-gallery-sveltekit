<script lang="ts">
    import type { PageProps } from './$types';
    import type { UploadEntry, RenameEntry, DeleteEntry } from '$lib/models/album';
    import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
    import DayAlbumPage from '$lib/components/pages/album/day/DayAlbumPage.svelte';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';
    import { albumStore } from '$lib/stores/AlbumStore.svelte';

    let { data }: PageProps = $props();
    let path = $derived(data.albumPath);
    let albumEntry = $derived(albumStore.albums.get(path));
    let album = $derived(albumEntry?.album);
    let loadStatus = $derived(albumEntry?.loadStatus);
    let isAdmin = $derived(sessionStore.isAdmin);

    let uploads: ReadonlyArray<UploadEntry> | undefined = $derived.by(() => {
        path; // triggers re-executing this derivation
        if (isAdmin)
            // Lazy load to encourage code bundler to put it into separate bundle that non-admins don't upload
            import('$lib/stores/UploadStore.svelte').then(({ uploadStore }) => {
                if (album?.path) return uploadStore.getUploadsForAlbum(path);
            });
        return undefined;
    });

    let renameEntry: RenameEntry | undefined = $derived.by(() => {
        path; // triggers re-executing this derivation
        if (isAdmin)
            // Lazy load to encourage code bundler to put it into separate bundle that non-admins don't upload
            import('$lib/stores/AlbumRenameStore.svelte').then(({ albumRenameStore }) => {
                if (album?.path) return albumRenameStore.renames.get(path);
            });
        return undefined;
    });

    let deleteEntry: DeleteEntry | undefined = $derived.by(() => {
        path; // triggers re-executing this derivation
        if (isAdmin)
            // Lazy load to encourage code bundler to put it into separate bundle that non-admins don't upload
            import('$lib/stores/AlbumDeleteStore.svelte').then(({ albumDeleteStore }) => {
                if (path) return albumDeleteStore.deletes.get(path);
            });
        return undefined;
    });
</script>

<DayAlbumRouting {loadStatus} {deleteEntry} {renameEntry}>
    {#snippet loaded()}
        {#if album}
            <DayAlbumPage {album} {uploads} />
        {/if}
    {/snippet}
</DayAlbumRouting>
