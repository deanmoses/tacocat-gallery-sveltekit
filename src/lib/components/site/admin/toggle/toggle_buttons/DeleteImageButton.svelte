<!--
  @component 
  
  Button to delete image
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import DeleteIcon from '$lib/components/site/icons/DeleteIcon.svelte';
    import { imageDeleteMachine } from '$lib/state/admin/ImageDeleteMachine.svelte';
    import { getParentFromPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let imagePath: string = $derived(page.url.pathname);
    let show: boolean = $derived(isValidImagePath(imagePath)); // Show this button only on image pages

    function onDeleteButtonClick() {
        imageDeleteMachine.delete(imagePath);
        goto(getParentFromPath(imagePath));
    }
</script>

{#if show}
    <ControlStripButton onclick={onDeleteButtonClick}><DeleteIcon />Delete</ControlStripButton>
{/if}
