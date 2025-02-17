<!--
  @component 
  
  Page to crop an image thumbnail
-->
<script lang="ts">
    import ImagePageLayout from './layouts/ImagePageLayout.svelte';
    import CropImage from './CropImage.svelte';
    import type { Image } from '$lib/models/GalleryItemInterfaces';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';
    import { goto } from '$app/navigation';
    import { albumThumbnailCropStore, ImageThumbnailCropStatus } from '$lib/stores/ImageThumbnailCropStore.svelte';

    interface Props {
        image: Image;
    }

    let { image }: Props = $props();
    let imageTitle: string = $derived(image.title);
    let cropStatus: string = $derived(albumThumbnailCropStore.state.get(image.path)?.status ?? 'NOT_CROPPING');
    let disableButtons: boolean = $derived(cropStatus == ImageThumbnailCropStatus.IN_PROGRESS);
    let cropper = $state() as CropImage;

    function onCancel() {
        goto(image.path);
    }

    function onSave() {
        const imagePath = image.path;
        const crop = cropper.getCrop();
        albumThumbnailCropStore.crop(imagePath, crop);
    }
</script>

<ImagePageLayout title={imageTitle}>
    {#snippet caption()}
        <button onclick={onCancel} disabled={disableButtons}><CancelIcon /> Cancel</button>
        <button onclick={onSave} disabled={disableButtons}><SaveIcon /> Save</button>
    {/snippet}

    {#snippet imageHtml()}
        <CropImage bind:this={cropper} {image} />
    {/snippet}
</ImagePageLayout>
