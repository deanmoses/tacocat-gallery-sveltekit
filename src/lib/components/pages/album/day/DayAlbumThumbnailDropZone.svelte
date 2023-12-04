<!--
  @component Thumbnail area for day albums that's also a drop zone for uploading images
-->
<script lang="ts">
    import Thumbnails from '$lib/components/site/Thumbnails.svelte';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import { isAdmin } from '$lib/stores/SessionStore';
    import UploadReplaceConfirmDialog from '$lib/components/site/admin/toggle/toggle_buttons/UploadReplaceConfirmDialog.svelte';
    import {
        getDroppedImages,
        getFilesAlreadyInAlbum,
        getSanitizedFiles,
        uploadSanitizedImages,
        type ImagesToUpload,
    } from '$lib/stores/admin/UploadStoreLogic';

    let dragging = false;
    $: dragging = dragging;

    let imagesToUpload: ImagesToUpload[] = [];
    $: imagesToUpload = imagesToUpload;

    let dialog: UploadReplaceConfirmDialog;

    function dragEnter(e: DragEvent) {
        if (!$isAdmin) return;
        if (e.dataTransfer?.types.includes('Files')) {
            e.preventDefault();
            dragging = true;
        }
    }

    function dragOver(e: DragEvent) {
        if (!$isAdmin) return;
        if (e.dataTransfer?.types.includes('Files')) {
            e.preventDefault();
        }
    }

    function dragLeave(e: DragEvent) {
        if (!$isAdmin) return;
        if (e.dataTransfer?.types.includes('Files')) {
            dragging = false;
        }
    }

    async function drop(e: DragEvent) {
        if (!$isAdmin) return;
        if (e.dataTransfer?.types.includes('Files')) {
            e.preventDefault();
            dragging = false;
            const files = await getDroppedImages(e);
            const albumPath = get(page).url.pathname + '/';
            imagesToUpload = getSanitizedFiles(files, albumPath);
            if (!imagesToUpload || !imagesToUpload.length) return;
            const filesAlreadyInAlbum = getFilesAlreadyInAlbum(imagesToUpload, albumPath);
            if (filesAlreadyInAlbum.length > 0) {
                dialog.show(filesAlreadyInAlbum);
            } else {
                await uploadSanitizedImages(imagesToUpload, albumPath);
            }
        }
    }

    async function onConfirmUploadReplace() {
        const albumPath = get(page).url.pathname + '/';
        await uploadSanitizedImages(imagesToUpload, albumPath);
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<section
    class:dragging
    on:dragenter|preventDefault={dragEnter}
    on:dragover|preventDefault={dragOver}
    on:dragleave|preventDefault={dragLeave}
    on:drop|preventDefault={drop}
>
    <h2 style="display:none">Thumbnails</h2>
    <Thumbnails>
        <slot name="thumbnails" />
    </Thumbnails>
</section>
<UploadReplaceConfirmDialog bind:this={dialog} on:dialogConfirm={onConfirmUploadReplace} />

<style>
    .dragging {
        filter: grayscale(50%) brightness(1.1);
        min-height: 100%;
    }
</style>
