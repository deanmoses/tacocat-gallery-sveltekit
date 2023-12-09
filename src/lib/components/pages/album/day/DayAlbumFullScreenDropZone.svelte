<script lang="ts">
    import FullScreenDropZone from '$lib/components/site/admin/FullScreenDropZone.svelte';
    import UploadReplaceConfirmDialog from '$lib/components/site/admin/toggle/toggle_buttons/UploadReplaceConfirmDialog.svelte';
    import { isAdmin } from '$lib/stores/SessionStore';
    import {
        getDroppedImages,
        getFilesAlreadyInAlbum,
        getSanitizedFiles,
        uploadSanitizedImages,
        type ImagesToUpload,
    } from '$lib/stores/admin/UploadStoreLogic';

    export let albumPath: string;

    /** So that the edit page can tell me whether it allows dropping */
    export let allowDrop: boolean = true;

    let dragging = false;
    $: dragging = dragging;

    let dialog: UploadReplaceConfirmDialog;

    let imagesToUpload: ImagesToUpload[] = [];
    $: imagesToUpload = imagesToUpload;

    function isDropAllowed(e: DragEvent): boolean {
        return allowDrop && $isAdmin && !!e.dataTransfer?.types.includes('Files');
    }

    async function onDrop(e: DragEvent): Promise<void> {
        const files = await getDroppedImages(e);
        imagesToUpload = getSanitizedFiles(files, albumPath);
        if (!imagesToUpload || !imagesToUpload.length) return;
        const filesAlreadyInAlbum = getFilesAlreadyInAlbum(imagesToUpload, albumPath);
        if (filesAlreadyInAlbum.length > 0) {
            dialog.show(filesAlreadyInAlbum);
        } else {
            await uploadSanitizedImages(imagesToUpload, albumPath);
        }
    }

    async function onConfirmUploadReplace(): Promise<void> {
        await uploadSanitizedImages(imagesToUpload, albumPath);
    }
</script>

<FullScreenDropZone {isDropAllowed} {onDrop}>Drop images or a 📁</FullScreenDropZone>
<UploadReplaceConfirmDialog bind:this={dialog} on:confirm={onConfirmUploadReplace} />
