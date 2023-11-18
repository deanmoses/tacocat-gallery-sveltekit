<!--
  @component Button to rename image or album
-->
<script lang="ts">
    import { page } from '$app/stores';
    import RenameIcon from '$lib/components/site/icons/RenameIcon.svelte';
    import {
        getParentAndNameFromPath,
        isValidDayAlbumName,
        isValidDayAlbumPath,
        isValidImagePath,
    } from '$lib/utils/galleryPathUtils';

    let path: string;
    $: path = $page.url.pathname;

    // Show this button only on day albums and images
    let show: boolean = false;
    $: show = isValidDayAlbumPath($page.url.pathname + '/') || isValidImagePath($page.url.pathname);

    async function onClick() {
        let thePath = path;
        if (!isValidImagePath(thePath)) {
            thePath = thePath + '/';
            if (!isValidDayAlbumPath(thePath)) throw new Error(`Invalid path [${thePath}]`);
        }
        const pathParts = getParentAndNameFromPath(thePath);
        const newName = prompt('New Name ', pathParts.name);
        if (!isValidDayAlbumName(newName)) {
            alert('invalid name');
        }
        const newPath = pathParts.parent + newName;
        console.log(`I should rename this to [${newPath}]`);
        // TODO
        // - call server rename
        // - goto(newPath);
        // - THEN somehow delete old album from AlbumStore - retrieve parent album?
    }
</script>

{#if show}
    <button on:click={onClick}><RenameIcon />Rename</button>
{/if}

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
