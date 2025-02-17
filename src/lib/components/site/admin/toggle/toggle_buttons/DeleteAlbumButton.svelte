<!--
  @component 
  
  Button to delete album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import DeleteIcon from '$lib/components/site/icons/DeleteIcon.svelte';
    import type { AlbumEntry } from '$lib/models/album';
    import { albumDeleteMachine } from '$lib/stores/admin/AlbumDeleteMachine.svelte';
    import { albumStore } from '$lib/stores/AlbumStore.svelte';
    import { getParentFromPath, isValidDayAlbumPath, isValidYearAlbumPath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let albumPath = $derived(page.url.pathname + '/');
    let isValidPath = $derived(isValidDayAlbumPath(albumPath) || isValidYearAlbumPath(albumPath));
    let albumEntry = $derived(albumStore.albums.get(albumPath));
    // Show this button on year and day albums but not root albums, and only if they don't have children
    let show: boolean = $derived(isValidPath && !hasChildren(albumEntry));

    function hasChildren(albumEntry: AlbumEntry | undefined): boolean {
        return !!albumEntry?.album?.albums?.length || !!albumEntry?.album?.images?.length;
    }

    function onDeleteButtonClick() {
        albumDeleteMachine.deleteAlbum(albumPath);
        goto(getParentFromPath(albumPath));
    }
</script>

{#if show}
    <ControlStripButton onclick={onDeleteButtonClick}><DeleteIcon />Delete</ControlStripButton>
{/if}
