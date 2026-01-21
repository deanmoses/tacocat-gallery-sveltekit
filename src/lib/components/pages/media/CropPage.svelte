<!--
  @component

  Page to crop the thumbnail of a media item
-->
<script lang="ts">
    import MediaPageLayout from './layouts/MediaPageLayout.svelte';
    import CropThumbnail from './CropThumbnail.svelte';
    import type { Media } from '$lib/models/GalleryItemInterfaces';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';
    import { goto } from '$app/navigation';
    import { cropMachine } from '$lib/stores/admin/CropMachine.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';
    import { CropStatus } from '$lib/models/album';

    interface Props {
        media: Media;
    }

    let { media }: Props = $props();
    let mediaTitle: string = $derived(media.title);
    let cropStatus: string = $derived(albumState.crops.get(media.path)?.status ?? 'NOT_CROPPING');
    let disableButtons: boolean = $derived(cropStatus == CropStatus.IN_PROGRESS);
    let cropper = $state() as CropThumbnail;

    function onCancel() {
        goto(media.path);
    }

    function onSave() {
        cropMachine.crop(media.path, cropper.getCrop());
        goto(media.path);
    }
</script>

<MediaPageLayout title={mediaTitle}>
    {#snippet caption()}
        <button onclick={onCancel} disabled={disableButtons}><CancelIcon /> Cancel</button>
        <button onclick={onSave} disabled={disableButtons}><SaveIcon /> Save</button>
    {/snippet}

    {#snippet imageHtml()}
        <CropThumbnail bind:this={cropper} {media} />
    {/snippet}
</MediaPageLayout>
