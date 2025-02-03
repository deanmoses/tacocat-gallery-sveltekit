<script lang="ts">
    import type { PageProps } from './$types';
    import type { DeleteEntry } from '$lib/models/album';
    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumPage from '$lib/components/pages/album/year/YearAlbumPage.svelte';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';
    import { albumStore } from '$lib/stores/AlbumStore.svelte';

    let { data }: PageProps = $props();
    let path = $derived(data.albumPath);
    let albumEntry = $derived(albumStore.albums.get(path));
    let album = $derived(albumEntry?.album);
    let loadStatus = $derived(albumEntry?.loadStatus);
    let deleteEntry: DeleteEntry | undefined = $derived.by(() => {
        path; // triggers re-executing this derivation
        if (sessionStore.isAdmin) {
            import('$lib/stores/AlbumDeleteStore.svelte').then(({ albumDeleteStore }) => {
                if (album?.path) return albumDeleteStore.deletes.get(path);
            });
        }
        return undefined;
    });
</script>

<YearAlbumRouting {loadStatus} {deleteEntry}>
    {#snippet loaded()}
        {#if album}
            <YearAlbumPage {album} />
        {/if}
    {/snippet}
</YearAlbumRouting>
