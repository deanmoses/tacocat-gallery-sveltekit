<script lang="ts">
    import type { PageData } from './$types';
    import { isAdmin } from '$lib/stores/SessionStore';
    import type { UploadEntry, RenameEntry, DeleteEntry } from '$lib/models/album';
    import DayAlbumRouting from '$lib/components/pages/album/day/DayAlbumRouting.svelte';
    import DayAlbumPage from '$lib/components/pages/album/day/DayAlbumPage.svelte';

    export let data: PageData;

    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: loadStatus = $albumEntry.loadStatus;

    // Lazy load these to encourage the code bundler to put them
    // into separate bundles that non-admins don't upload
    let uploads: UploadEntry[] | undefined = undefined;
    let renameEntry: RenameEntry | undefined = undefined;
    let deleteEntry: DeleteEntry | undefined = undefined;
    $: if ($isAdmin) {
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
</script>

<DayAlbumRouting {loadStatus} {deleteEntry} {renameEntry}>
    <svelte:fragment slot="loaded">
        {#if album}
            <DayAlbumPage {album} {uploads} />
        {/if}
    </svelte:fragment>
</DayAlbumRouting>
