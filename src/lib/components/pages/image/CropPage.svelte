<!--
  @component Page to crop an image thumbnail
-->
<script lang="ts">
    import ImagePageLayout from './layouts/ImagePageLayout.svelte';

    import BigImage from './BigImage.svelte';
    import type { Image } from '$lib/models/GalleryItemInterfaces';

    export let year: string;
    export let image: Image;
</script>

<ImagePageLayout {year} title={image.title}>
    <svelte:fragment slot="image">
        <BigImage {image} />
    </svelte:fragment>
</ImagePageLayout>
