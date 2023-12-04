<!--
  @component Button to delete image
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import DeleteIcon from '$lib/components/site/icons/DeleteIcon.svelte';
    import { deleteImage } from '$lib/stores/admin/ImageDeleteStoreLogic';
    import { getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    $: imagePath = $page.url.pathname;

    let show: boolean = false;
    $: show = isValidImagePath(imagePath); // Show this button only on image pages

    async function onDeleteButtonClick() {
        await deleteImage(imagePath);
        goto(getParentFromPath(imagePath));
    }
</script>

{#if show}
    <ControlStripButton on:click|once={onDeleteButtonClick}><DeleteIcon />Delete</ControlStripButton>
{/if}
