<!--
  @component 
  
  Button to set image as the thumbnail for the year
-->
<script lang="ts">
    import { page } from '$app/state';
    import { setAlbumThumbnail } from '$lib/stores/admin/AlbumThumbnailLogic';
    import { getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
    import { toast } from '@zerodevx/svelte-toast';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';
    import SetYearThumbnailConfirmDialog from './SetYearThumbnailConfirmDialog.svelte';
    import StarIcon from '$lib/components/site/icons/StarIcon.svelte';

    let imagePath: string = $derived(page.url.pathname);
    let show: boolean = $derived(isValidImagePath(imagePath)); // Show this button only on image pages
    let dialog: SetYearThumbnailConfirmDialog | undefined = $state();

    function onclick(): void {
        dialog?.show();
    }

    async function onConfirm(): Promise<void> {
        const dayAlbumPath = getParentFromPath(imagePath);
        const yearAlbumPath = getParentFromPath(dayAlbumPath);
        await setAlbumThumbnail(yearAlbumPath, imagePath);
        const year = yearAlbumPath.replaceAll('/', '');
        toast.push(`Thumnbnail set for ${year}`);
    }
</script>

{#if show}
    <ControlStripButton title="Set thumbnail for year" {onclick}><StarIcon />Year</ControlStripButton>
    <SetYearThumbnailConfirmDialog bind:this={dialog} {onConfirm} />
{/if}
