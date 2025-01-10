<script lang="ts">
    import type { PageData } from './$types';
    import { isAdmin } from '$lib/stores/SessionStore';
    import type { UploadEntry, RenameEntry, DeleteEntry } from '$lib/models/album';
    import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
    import DayAlbumPage from '$lib/components/pages/album/day/DayAlbumPage.svelte';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let albumEntry = $derived(data.albumEntry);
    let album = $derived($albumEntry.album);
    let loadStatus = $derived($albumEntry.loadStatus);

    // Lazy load these to encourage the code bundler to put them
    // into separate bundles that non-admins don't upload
    let uploads: UploadEntry[] | undefined = $state();
    let renameEntry: RenameEntry | undefined = $state();
    let deleteEntry: DeleteEntry | undefined = $state();
    $effect(() => {
        if ($isAdmin) {
            import('$lib/stores/UploadStore').then(({ getUploads }) => {
                if (!album?.path) return;
                getUploads(album.path).subscribe((entry) => {
                    uploads = entry;
                });
            });
            import('$lib/stores/AlbumRenameStore').then(({ getAlbumRenameEntry }) => {
                if (!album?.path) return;
                getAlbumRenameEntry(album.path).subscribe((entry) => {
                    renameEntry = entry;
                });
            });
            import('$lib/stores/AlbumDeleteStore').then(({ getAlbumDeleteEntry }) => {
                if (!album?.path) return;
                getAlbumDeleteEntry(album.path).subscribe((entry) => {
                    deleteEntry = entry;
                });
            });
        }
    });
</script>

<DayAlbumRouting {loadStatus} {deleteEntry} {renameEntry}>
    {#snippet loaded()}
        {#if album}
            <DayAlbumPage {album} {uploads} />
        {/if}
    {/snippet}
</DayAlbumRouting>
