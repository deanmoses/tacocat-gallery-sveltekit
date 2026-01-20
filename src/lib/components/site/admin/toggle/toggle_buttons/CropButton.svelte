<!--
  @component 
  
  Button to re-crop thumbnail of a media item.  
  For videos, this crops a thumbnail of the video's poster frame.
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import CropIcon from '$lib/components/site/icons/CropIcon.svelte';
    import { isValidMediaPath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let path: string = $derived(page.url.pathname);
    let show: boolean = $derived(isValidMediaPath(path)); // Show this button only on media pages
    function onCropButtonClick() {
        goto(`${path}/crop`);
    }
</script>

{#if show}
    <ControlStripButton onclick={onCropButtonClick} title="Re-crop thumbnail"><CropIcon />Crop</ControlStripButton>
{/if}
