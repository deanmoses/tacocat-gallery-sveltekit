<!--
  @component Button to set image as the thumbnail for the year
-->
<script lang="ts">
    import { page } from '$app/stores';
    import FilledStarIcon from '$lib/components/site/icons/FilledStarIcon.svelte';
    import { getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';

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

{#if show}<button on:click|once={onSetThumbnailButtonClick}><FilledStarIcon />Year</button>{/if}

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
