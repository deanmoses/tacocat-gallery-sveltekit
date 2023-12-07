<!--
  @component Button to set image as the thumbnail for the year
-->
<script lang="ts">
    import { page } from '$app/stores';
    import FilledStarIcon from '$lib/components/site/icons/FilledStarIcon.svelte';
    import { setAlbumThumbnail } from '$lib/stores/admin/AlbumThumbnailLogic';
    import { getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
    import { toast } from '@zerodevx/svelte-toast';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let imagePath: string;
    $: imagePath = $page.url.pathname;

    let show: boolean = false;
    $: show = isValidImagePath(imagePath); // Show this button only on image pages

    async function onSetThumbnailButtonClick() {
        const dayAlbumPath = getParentFromPath(imagePath);
        const yearAlbumPath = getParentFromPath(dayAlbumPath);
        await setAlbumThumbnail(yearAlbumPath, imagePath);
        const year = yearAlbumPath.replaceAll('/', '');
        toast.push(`Thumnbnail set for ${year}`);
    }
</script>

{#if show}
    <ControlStripButton title="Set thumbnail for year" on:click|once={onSetThumbnailButtonClick}
        ><FilledStarIcon />Year</ControlStripButton
    >
{/if}
