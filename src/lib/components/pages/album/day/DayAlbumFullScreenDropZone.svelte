<!--
  @component 
  
  Paints a full screen drag/drop zone over the day album page.
-->
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

    interface Props {
        albumPath: string;
        /** So that the edit page can tell me whether it allows dropping */
        allowDrop?: boolean;
    }

    let { albumPath, allowDrop = true }: Props = $props();

    let dialog: UploadReplaceConfirmDialog | undefined = $state();

    let imagesToUpload: ImagesToUpload[] = $state([]);

    function isDropAllowed(e: DragEvent): boolean {
        return allowDrop && $isAdmin && !!e.dataTransfer?.types.includes('Files');
    }

    async function onDrop(e: DragEvent): Promise<void> {
        const files = await getDroppedImages(e);
        imagesToUpload = getSanitizedFiles(files, albumPath);
        if (!imagesToUpload || !imagesToUpload.length) return;
        const filesAlreadyInAlbum = getFilesAlreadyInAlbum(imagesToUpload, albumPath);
        if (filesAlreadyInAlbum.length > 0) {
            dialog?.show(filesAlreadyInAlbum);
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
