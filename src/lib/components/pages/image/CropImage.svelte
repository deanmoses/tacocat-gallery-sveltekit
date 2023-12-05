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

    let newCrop: Crop;

    function onCropChange(e: CustomEvent<any>) {
        console.log('onCropChange', e.detail.percent);
        newCrop = e.detail.percent;
    }
</script>

<div class="cropContainer">
    <Cropper image={image.detailUrl} aspect={1} showGrid={false} on:cropcomplete={onCropChange} />
</div>

<style>
    .cropContainer {
        position: relative;
        width: 100%;
        min-height: 400px;
        background-color: white;
    }
</style>
