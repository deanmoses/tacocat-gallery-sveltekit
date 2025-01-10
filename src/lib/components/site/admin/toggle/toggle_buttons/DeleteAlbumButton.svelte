<!--
  @component Button to delete album
-->
<script lang="ts">
    import { run } from 'svelte/legacy';

    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import DeleteIcon from '$lib/components/site/icons/DeleteIcon.svelte';
    import type { AlbumEntry } from '$lib/models/album';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { deleteAlbum } from '$lib/stores/admin/AlbumDeleteStoreLogic';
    import { getParentFromPath, isValidDayAlbumPath, isValidYearAlbumPath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    // Show this button on year and day albums but not root albums, and only if they don't have children
    let show: boolean = $state(false);

    export function hasChildren(album: AlbumEntry | undefined): boolean {
        return !!album?.album?.albums?.length || !!album?.album?.images?.length;
    }

    async function onDeleteButtonClick() {
        try {
            await deleteAlbum(albumPath);
            goto(getParentFromPath(albumPath));
        } catch (e) {
            console.error(e);
        }
    }
    let albumPath = $derived(page.url.pathname + '/');
    let isValidPath = $derived(isValidDayAlbumPath(albumPath) || isValidYearAlbumPath(albumPath));
    let album = $derived(isValidPath ? albumStore.get(albumPath, false /*don't trigger fetch*/) : undefined);
    run(() => {
        show = isValidPath && !hasChildren($album);
    });
</script>

{#if show}
    <ControlStripButton onclick={onDeleteButtonClick}><DeleteIcon />Delete</ControlStripButton>
{/if}
