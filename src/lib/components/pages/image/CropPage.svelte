<!--
  @component Page to crop an image thumbnail
-->
<script lang="ts">
    import ImagePageLayout from './layouts/ImagePageLayout.svelte';
    import CropImage from './CropImage.svelte';
    import type { Image } from '$lib/models/GalleryItemInterfaces';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';
    import { goto } from '$app/navigation';

    export let year: string;
    export let image: Image;
    let cropper: CropImage;

    function onCancel() {
        goto(image.path);
    }

    function onSave() {
        console.log(`I should save crop`, cropper.getCrop());
    }
</script>

<ImagePageLayout {year} title={image.title}>
    <svelte:fragment slot="title">
        <button on:click={onCancel}><CancelIcon /> Cancel</button>
        <button on:click={onSave}><SaveIcon /> Save</button>
    </svelte:fragment>
    <svelte:fragment slot="image">
        <CropImage bind:this={cropper} {image} />
    </svelte:fragment>
</ImagePageLayout>
