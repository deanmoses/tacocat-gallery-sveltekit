<!--
  @component Button to re-crop image thumbnail
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import CropIcon from '$lib/components/site/icons/CropIcon.svelte';
    import { isValidImagePath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let path: string;
    $: path = $page.url.pathname;

    let show: boolean = false;
    $: show = isValidImagePath(path); // Show this button only on image pages

    async function onCropButtonClick() {
        goto(`/edit${path}/crop`);
    }
</script>

{#if show}
    <ControlStripButton on:click|once={onCropButtonClick} title="Re-crop thumbnail"><CropIcon />Crop</ControlStripButton
    >
{/if}
