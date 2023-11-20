<!--
  @component An image cropper
-->
<script lang="ts">
    import Cropper from 'svelte-easy-crop';
    import type { Image } from '$lib/models/GalleryItemInterfaces';

    type Crop = { x: number; y: number; height: number; width: number };
    export let image: Image;
    export function getCrop(): Crop {
        return newCrop;
    }

    let initialCrop = { x: 0, y: 0 };
    let newCrop: Crop;

    function onCropChange(e) {
        console.log('onCropChange', e.detail.percent);
        newCrop = e.detail.percent;
    }
</script>

<div class="cropContainer">
    <Cropper
        image={image.detailUrl}
        aspect="1"
        showGrid={false}
        crop={initialCrop}
        zoom="1"
        on:cropcomplete={onCropChange}
    />
</div>

<style>
    .cropContainer {
        position: relative;
        width: 100%;
        min-height: 400px;
        background-color: white;
    }
</style>
