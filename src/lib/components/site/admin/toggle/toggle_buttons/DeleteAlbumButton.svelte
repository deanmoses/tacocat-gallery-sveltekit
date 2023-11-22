<!--
  @component Button to delete album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import DeleteIcon from '$lib/components/site/icons/DeleteIcon.svelte';
    import { deleteAlbum } from '$lib/stores/AlbumDeleteStore';
    import { getParentFromPath, isValidAlbumPath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    $: albumPath = $page.url.pathname + '/';

    let show: boolean = false;
    $: show = albumPath !== '/' && isValidAlbumPath(albumPath); // Show this button on year and day albums

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
