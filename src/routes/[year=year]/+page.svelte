<script lang="ts">
    import type { PageData } from './$types';
    import { isAdmin } from '$lib/stores/SessionStore';
    import { get } from 'svelte/store';
    import type { DeleteEntry } from '$lib/models/album';
    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumPage from '$lib/components/pages/album/year/YearAlbumPage.svelte';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let albumEntry = $derived(data.albumEntry);
    let album = $derived($albumEntry.album);
    let loadStatus = $derived($albumEntry.loadStatus);
    let deleteEntry: DeleteEntry | undefined = $state();

    $effect(() => {
        if ($isAdmin) {
            import('$lib/stores/AlbumDeleteStore').then(({ getAlbumDeleteEntry }) => {
                if (!album?.path) return;
                deleteEntry = get(getAlbumDeleteEntry(album.path));
            });
        }
    });
</script>

<YearAlbumRouting {loadStatus} {deleteEntry}>
    {#snippet loaded()}
        {#if album}
            <YearAlbumPage {album} />
        {/if}
    {/snippet}
</YearAlbumRouting>
