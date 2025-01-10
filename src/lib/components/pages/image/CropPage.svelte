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
    import { albumStore } from '$lib/stores/AlbumStore';
    import { AlbumUpdateStatus } from '$lib/models/album';
    import { getParentFromPath } from '$lib/utils/galleryPathUtils';
    import { recropThumbnailUrl } from '$lib/utils/config';
    import { toast } from '@zerodevx/svelte-toast';

    interface Props {
        image: Image;
    }

    let { image }: Props = $props();
    let cropper: CropImage = $state();

    function onCancel() {
        goto(image.path);
    }

    async function onSave() {
        const imagePath = image.path;
        const crop = cropper.getCrop();
        console.log(`Saving crop of image [${imagePath}]`, crop);

        // Update album state to "Saving...", not sure this is useful
        const albumPath = getParentFromPath(imagePath);
        albumStore.setUpdateStatus(albumPath, AlbumUpdateStatus.UPDATING);
        try {
            // Make the save request
            const response = await fetch(recropThumbnailUrl(imagePath), {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(crop),
            });

            // Check for errors
            if (!response.ok) {
                const msg = (await response.json()).errorMessage || response.statusText;
                toast.push(`Error cropping thumbnail: ${msg}`);
                throw new Error(`Error cropping thumbnail: ${msg}`);
            }

            console.log(`Updated thumbnail of [${imagePath}]`);

            // Reload parent album to:
            //  1) get the image's new thumbnail
            //  2) this image may be the album's thumb
            console.log(`Reloading album [${albumPath}] from server`);
            await albumStore.fetchFromServerAsync(albumPath); // force reload from server

            // Reload year album because this image may be the year's thumb
            // TODO: not doing yet because back end isn't setting year's thumb yet
            // console.log(`Reloading parent album [${getParentFromPath(albumPath)}] from server`);
            // await albumStore.fetchFromServerAsync(getParentFromPath(albumPath)); // force reload from server

            toast.push(`Thumbnail cropped`);
            goto(imagePath);
        } finally {
            // Reset store state
            albumStore.setUpdateStatus(albumPath, AlbumUpdateStatus.NOT_UPDATING);
        }
    }
</script>

<ImagePageLayout title={image.title}>
    {#snippet caption()}
        <button onclick={onCancel}><CancelIcon /> Cancel</button>
        <button onclick={onSave}><SaveIcon /> Save</button>
    {/snippet}

    {#snippet image()}
        <CropImage bind:this={cropper} {image} />
    {/snippet}
</ImagePageLayout>
