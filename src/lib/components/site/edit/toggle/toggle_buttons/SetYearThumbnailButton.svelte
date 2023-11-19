<!--
  @component Button to set image as the thumbnail for the year
-->
<script lang="ts">
    import { page } from '$app/stores';
    import FilledStarIcon from '$lib/components/site/icons/FilledStarIcon.svelte';
    import { getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../controls/buttons/ControlStripButton.svelte';

    let path: string;
    $: path = $page.url.pathname;

    let show: boolean = false;
    $: show = isValidImagePath(path); // Show this button only on image pages

    async function onSetThumbnailButtonClick() {
        const dayAlbumPath = getParentFromPath(path);
        const yearPath = getParentFromPath(dayAlbumPath);
        const year = yearPath.replaceAll('/', '');
        console.log(`I should set image [${path}] as the thumbnail for year [${year}]`);
    }
</script>

{#if show}
    <ControlStripButton on:click|once={onSetThumbnailButtonClick}><FilledStarIcon />Year</ControlStripButton>
{/if}
