<!--
  @component

  Button to delete a media item (image or video)
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import DeleteIcon from '$lib/components/site/icons/DeleteIcon.svelte';
    import { mediaDeleteMachine } from '$lib/stores/admin/MediaDeleteMachine.svelte';
    import { getParentFromPath, isValidMediaPath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let imagePath: string = $derived(page.url.pathname);
    let show: boolean = $derived(isValidMediaPath(imagePath)); // Show this button on media pages (images and videos)

    function onDeleteButtonClick() {
        mediaDeleteMachine.delete(imagePath);
        goto(getParentFromPath(imagePath));
    }
</script>

{#if show}
    <ControlStripButton onclick={onDeleteButtonClick}><DeleteIcon />Delete</ControlStripButton>
{/if}
