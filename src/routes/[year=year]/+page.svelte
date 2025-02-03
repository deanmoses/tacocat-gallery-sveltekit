<script lang="ts">
    import type { PageProps } from './$types';
    import type { DeleteEntry } from '$lib/models/album';
    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumPage from '$lib/components/pages/album/year/YearAlbumPage.svelte';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';

    let { data }: PageProps = $props();
    let albumEntry = $derived(data.albumEntry);
    let album = $derived($albumEntry.album);
    let loadStatus = $derived($albumEntry.loadStatus);
    let deleteEntry: DeleteEntry | undefined = $derived.by(() => {
        album; // triggers re-executing this derivation
        if (sessionStore.isAdmin) {
            import('$lib/stores/AlbumDeleteStore.svelte').then(({ albumDeleteStore }) => {
                if (album?.path) return albumDeleteStore.deletes.get(album.path);
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
