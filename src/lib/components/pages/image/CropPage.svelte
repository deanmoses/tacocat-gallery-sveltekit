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
    import { cropMachine } from '$lib/stores/admin/CropMachine.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';
    import { ImageStatus } from '$lib/models/album';

    interface Props {
        image: Image;
    }

    let { image }: Props = $props();
    let imageTitle: string = $derived(image.title);
    let cropStatus: string | undefined = $derived(albumState.images.get(image.path)?.status);
    let disableButtons: boolean = $derived(cropStatus == ImageStatus.CROPPING);
    let cropper = $state() as CropImage;

    function onCancel() {
        goto(image.path);
    }

    function onSave() {
        cropMachine.crop(image.path, cropper.getCrop());
        goto(image.path);
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
