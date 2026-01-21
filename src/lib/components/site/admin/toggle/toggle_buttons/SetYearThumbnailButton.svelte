<!--
  @component 
  
  Button to set which media item's thumbnail will be used as the year's thumbnail.
-->
<script lang="ts">
    import { page } from '$app/state';
    import { getParentFromPath, isValidMediaPath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';
    import SetYearThumbnailConfirmDialog from './SetYearThumbnailConfirmDialog.svelte';
    import StarIcon from '$lib/components/site/icons/StarIcon.svelte';
    import { albumThumbnailSetMachine } from '$lib/stores/admin/AlbumThumbnailSetMachine.svelte';

    let path: string = $derived(page.url.pathname);
    let show: boolean = $derived(isValidMediaPath(path)); // Show this button only on media pages
    let dialog = $state() as SetYearThumbnailConfirmDialog;

    function onclick(): void {
        dialog.show();
    }

    function onConfirm(): void {
        const dayAlbumPath = getParentFromPath(path);
        const yearAlbumPath = getParentFromPath(dayAlbumPath);
        albumThumbnailSetMachine.setAlbumThumbnail(yearAlbumPath, path);
    }
</script>

{#if show}
    <ControlStripButton title="Set thumbnail for year" {onclick}><StarIcon />Year</ControlStripButton>
    <SetYearThumbnailConfirmDialog bind:this={dialog} {onConfirm} />
{/if}
