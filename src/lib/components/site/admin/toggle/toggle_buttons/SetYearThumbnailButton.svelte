<!--
  @component 
  
  Button to set image as the thumbnail for the year
-->
<script lang="ts">
    import { page } from '$app/state';
    import { getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';
    import SetYearThumbnailConfirmDialog from './SetYearThumbnailConfirmDialog.svelte';
    import StarIcon from '$lib/components/site/icons/StarIcon.svelte';
    import { albumThumbnailSetMachine } from '$lib/stores/admin/AlbumThumbnailSetMachine.svelte';

    let imagePath: string = $derived(page.url.pathname);
    let show: boolean = $derived(isValidImagePath(imagePath)); // Show this button only on image pages
    let dialog = $state() as SetYearThumbnailConfirmDialog;

    function onclick(): void {
        dialog.show();
    }

    async function onConfirm(): Promise<void> {
        const dayAlbumPath = getParentFromPath(imagePath);
        const yearAlbumPath = getParentFromPath(dayAlbumPath);
        albumThumbnailSetMachine.setAlbumThumbnail(yearAlbumPath, imagePath);
    }
</script>

{#if show}
    <ControlStripButton title="Set thumbnail for year" {onclick}><StarIcon />Year</ControlStripButton>
    <SetYearThumbnailConfirmDialog bind:this={dialog} {onConfirm} />
{/if}
