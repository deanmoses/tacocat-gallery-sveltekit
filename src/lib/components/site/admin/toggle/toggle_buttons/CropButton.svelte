<!--
  @component 
  
  Button to re-crop image thumbnail
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import CropIcon from '$lib/components/site/icons/CropIcon.svelte';
    import { isValidImagePath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let path: string = $derived(page.url.pathname);
    let show: boolean = $derived(isValidImagePath(path)); // Show this button only on image pages

    function onCropButtonClick() {
        goto(`${path}/crop`);
    }
</script>

{#if show}
    <ControlStripButton onclick={onCropButtonClick} title="Re-crop thumbnail"><CropIcon />Crop</ControlStripButton>
{/if}
