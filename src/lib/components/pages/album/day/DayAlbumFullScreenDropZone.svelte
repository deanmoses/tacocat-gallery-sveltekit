<!--
  @component 
  
  Paints a full screen drag/drop zone over the day album page.
-->
<script lang="ts">
    import FullScreenDropZone from '$lib/components/site/admin/FullScreenDropZone.svelte';
    import UploadReplaceConfirmDialog from '$lib/components/site/admin/toggle/toggle_buttons/UploadReplaceConfirmDialog.svelte';
    import { getDroppedImages } from '$lib/stores/admin/DragDropUtils';
    import { uploadMachine, type ImagesToUpload } from '$lib/stores/admin/UploadMachine.svelte';
    import { getSanitizedFiles } from '$lib/stores/admin/UploadMachine.svelte';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

    interface Props {
        albumPath: string;
        /** So that the edit page can tell me whether it allows dropping */
        allowDrop?: boolean;
    }

    let { albumPath, allowDrop = true }: Props = $props();

    let dialog = $state() as UploadReplaceConfirmDialog;

    let imagesToUpload: ImagesToUpload[] = $state([]);

    function isDropAllowed(e: DragEvent): boolean {
        return allowDrop && sessionStore.isAdmin && !!e.dataTransfer?.types.includes('Files');
    }

    async function onDrop(e: DragEvent): Promise<void> {
        const files = await getDroppedImages(e);
        imagesToUpload = getSanitizedFiles(files, albumPath);
        if (!imagesToUpload || !imagesToUpload.length) return;
        const filesAlreadyInAlbum = getFilesAlreadyInAlbum(imagesToUpload, albumPath);
        if (filesAlreadyInAlbum.length > 0) {
            dialog.show(filesAlreadyInAlbum);
        } else {
            uploadMachine.uploadImages(albumPath, imagesToUpload);
        }
    }

    function getFilesAlreadyInAlbum(files: ImagesToUpload[], albumPath: string): string[] {
        const imageNames: string[] = [];
        const albumEntry = albumState.albums.get(albumPath);
        if (!albumEntry || !albumEntry.album || !albumEntry.album?.images?.length) return imageNames;
        for (const file of files) {
            const image = albumEntry.album?.getImage(file.imagePath);
            if (image) {
                console.log(`File [${file.imagePath}] is already in album [${albumPath}]`);
                imageNames.push(file.file.name);
            }
        }
        return imageNames;
    }

    function onConfirm(): void {
        uploadMachine.uploadImages(albumPath, imagesToUpload);
    }
</script>

<FullScreenDropZone {isDropAllowed} {onDrop}>Drop images or a 📁</FullScreenDropZone>
<UploadReplaceConfirmDialog bind:this={dialog} {onConfirm} />
