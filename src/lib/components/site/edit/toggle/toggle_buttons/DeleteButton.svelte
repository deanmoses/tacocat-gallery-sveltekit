<!--
  @component Button to delete image or album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import DeleteIcon from '$lib/components/site/icons/DeleteIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { getParentFromPath, isValidAlbumPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../controls/buttons/ControlStripButton.svelte';

    let path: string;
    $: path = $page.url.pathname;

    let show: boolean = false;
    $: show = path !== '/'; // Show this button everywhere but root

    async function onDeleteButtonClick() {
        let thePath = path;
        if (!isValidImagePath(thePath)) {
            thePath = thePath + '/';
            if (!isValidAlbumPath(thePath)) throw new Error(`Invalid path [${thePath}]`);
        }
        await albumStore.delete(thePath);
        goto(getParentFromPath(thePath));
    }
</script>

{#if show}
    <ControlStripButton on:click|once={onDeleteButtonClick}><DeleteIcon />Delete</ControlStripButton>
{/if}
