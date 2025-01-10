<!--
  @component Button to re-crop image thumbnail
-->
<script lang="ts">
    import { run } from 'svelte/legacy';

    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import CropIcon from '$lib/components/site/icons/CropIcon.svelte';
    import { isValidImagePath } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let path: string = $derived(page.url.pathname);

    let show: boolean = $state(false);
    run(() => {
        show = isValidImagePath(path);
    }); // Show this button only on image pages

    async function onCropButtonClick() {
        goto(`/edit${path}/crop`);
    }
</script>

{#if show}
    <ControlStripButton on:click|once={onCropButtonClick} title="Re-crop thumbnail"><CropIcon />Crop</ControlStripButton
    >
{/if}
