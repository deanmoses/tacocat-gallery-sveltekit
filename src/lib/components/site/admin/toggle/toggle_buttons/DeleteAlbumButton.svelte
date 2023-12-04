<!--
  @component Button to delete album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import DeleteIcon from '$lib/components/site/icons/DeleteIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { deleteAlbum } from '$lib/stores/admin/AlbumDeleteStoreLogic';
    import { getParentFromPath, isValidAlbumPath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    $: albumPath = $page.url.pathname + '/';

    // Show this button on year and day albums but not root albums, and only if they don't have children
    let show: boolean = false;
    $: show = albumPath !== '/' && isValidAlbumPath(albumPath) && !hasChildren(albumPath);

    export function hasChildren(albumPath: string): boolean {
        const album = albumStore.getFromInMemory(albumPath)?.album;
        return !!album?.albums?.length || !!album?.images?.length;
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
