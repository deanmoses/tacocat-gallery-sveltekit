<!--
    @component 

    An image cropper
-->
<script lang="ts">
    import Cropper, { type OnCropCompleteEvent } from 'svelte-easy-crop';
    import type { Image } from '$lib/models/GalleryItemInterfaces';

    type Crop = { x: number; y: number; height: number; width: number };
    interface Props {
        image: Image;
    }

    let { image }: Props = $props();
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
    <Cropper image={image.detailUrl} aspect={1} showGrid={false} oncropcomplete={onCropChange} />
</div>

<style>
    .cropContainer {
        position: relative;
        width: 100%;
        min-height: 400px;
        background-color: white;
    }
</style>
