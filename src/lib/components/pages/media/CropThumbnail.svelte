<!--
    @component

    An image cropper to crop the thumbnail of a media item
-->
<script lang="ts">
    import Cropper, { type OnCropCompleteEvent } from 'svelte-easy-crop';
    import type { Media } from '$lib/models/GalleryItemInterfaces';

    type Crop = { x: number; y: number; height: number; width: number };
    interface Props {
        media: Media;
    }

    let { media }: Props = $props();
    export function getCrop(): Crop {
        return newCrop;
    }

    let newCrop: Crop;

    function onCropChange(e: OnCropCompleteEvent) {
        console.log('onCropChange', e.percent);
        newCrop = e.percent;
    }
</script>

<div class="cropContainer">
    <Cropper image={media.detailUrl} aspect={1} showGrid={false} oncropcomplete={onCropChange} />
</div>

<style>
    .cropContainer {
        position: relative;
        width: 100%;
        min-height: 400px;
        background-color: white;
    }
</style>
