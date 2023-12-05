<!--
  @component Show big version of an image
-->
<script lang="ts">
    import type { Image } from '$lib/models/GalleryItemInterfaces';
    import { get } from 'svelte/store';
    import { page } from '$app/stores';
    import { isAdmin } from '$lib/stores/SessionStore';

    export let image: Image;

    /** Enable drag/dropping new versions of the image */
    export let enableDrop = false;
    $: dropEnabled = enableDrop && $isAdmin;

    let dragging = false;
    $: dragging = dragging;

    function dragEnter(e: DragEvent) {
        if (!allowDrop(e)) return;
        e.preventDefault();
        dragging = true;
    }

    function dragOver(e: DragEvent) {
        if (!allowDrop(e)) return;
        e.preventDefault();
    }

    function dragLeave(e: DragEvent) {
        if (!allowDrop(e)) return;
        dragging = false;
    }

    async function drop(e: DragEvent) {
        if (!allowDrop(e)) return;
        e.preventDefault();
        dragging = false;
        // Lazy load these to encourage the code bundler to put them
        // into separate bundles that non-admins never upload
        const { getDroppedImages, uploadSingleImage } = await import('$lib/stores/admin/UploadStoreLogic');
        const files = await getDroppedImages(e);
        if (!files || files.length !== 1) return;
        const imagePath = get(page).url.pathname;
        await uploadSingleImage(files[0], imagePath);
    }

    function allowDrop(e: DragEvent): boolean {
        return dropEnabled && isSingleFile(e);
    }

    function isSingleFile(e: DragEvent): boolean {
        return (
            !!e.dataTransfer?.types?.includes('Files') &&
            (e.dataTransfer?.files?.length === 1 || e.dataTransfer?.items?.length === 1)
        );
    }
</script>

<!-- 
	When navigating between images quickly, Svelte wasn't destroying the previous
	image fast enough: you'd briefly see the old image with the new text.  
	Wrapping the image in a #key block seems to make this problem go away.
-->
{#key image.path}
    <a href={image.originalUrl}>
        <img
            src={image.detailUrl}
            style="max-width: {image.detailWidth}px; max-height: {image.detailHeight}px;"
            alt={image.title}
            class:dragging
            on:dragenter|preventDefault={dragEnter}
            on:dragover|preventDefault={dragOver}
            on:dragleave|preventDefault={dragLeave}
            on:drop|preventDefault={drop}
        />
    </a>
{/key}

<style>
    img {
        object-fit: contain;
        width: 100%;
        height: 100%;
    }
    .dragging {
        filter: grayscale(50%) brightness(1.1);
        opacity: 80%;
        filter: blur(3px);
    }
</style>
