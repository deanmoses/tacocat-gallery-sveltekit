<!--
  @component Button to delete album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import DeleteIcon from '$lib/components/site/icons/DeleteIcon.svelte';
    import type { AlbumEntry } from '$lib/models/album';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { deleteAlbum } from '$lib/stores/admin/AlbumDeleteStoreLogic';
    import { getParentFromPath, isValidDayAlbumPath, isValidYearAlbumPath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    $: albumPath = $page.url.pathname + '/';
    $: isValidPath = isValidDayAlbumPath(albumPath) || isValidYearAlbumPath(albumPath);
    $: album = isValidPath ? albumStore.get(albumPath) : undefined;

    // Show this button on year and day albums but not root albums, and only if they don't have children
    let show: boolean = false;
    $: show = isValidPath && !hasChildren($album);

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
</script>

{#if show}
    <ControlStripButton on:click|once={onDeleteButtonClick}><DeleteIcon />Delete</ControlStripButton>
{/if}
