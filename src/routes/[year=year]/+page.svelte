<script lang="ts">
    import type { PageData } from './$types';
    import { isAdmin } from '$lib/stores/SessionStore';
    import { get } from 'svelte/store';
    import type { DeleteEntry } from '$lib/models/album';
    import YearAlbumRouting from '$lib/components/pages/album/year/YearAlbumRouting.svelte';
    import YearAlbumPage from '$lib/components/pages/album/year/YearAlbumPage.svelte';

    export let data: PageData;
    $: albumEntry = data.albumEntry;
    $: album = $albumEntry.album;
    $: loadStatus = $albumEntry.loadStatus;
    let deleteEntry: DeleteEntry | undefined = undefined;
    $: if ($isAdmin) {
        import('$lib/stores/AlbumDeleteStore').then(({ getAlbumDeleteEntry }) => {
            if (!album?.path) return;
            deleteEntry = get(getAlbumDeleteEntry(album.path));
        });
    }
</script>

<YearAlbumRouting {loadStatus} {deleteEntry}>
    <svelte:fragment slot="loaded">
        {#if album}
            <YearAlbumPage {album} />
        {/if}
    </svelte:fragment>
</YearAlbumRouting>
