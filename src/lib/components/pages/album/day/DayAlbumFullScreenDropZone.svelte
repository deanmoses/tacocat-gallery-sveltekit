<!--
  @component

  Paints a full screen drag/drop zone over the day album page.
-->
<script lang="ts">
    import FullScreenDropZone from '$lib/components/site/admin/FullScreenDropZone.svelte';
    import UploadReplaceConfirmDialog from '$lib/components/site/admin/toggle/toggle_buttons/UploadReplaceConfirmDialog.svelte';
    import { getDroppedFiles } from '$lib/stores/admin/DragDropUtils';
    import { uploadMachine, getSanitizedFiles } from '$lib/stores/admin/UploadMachine.svelte';
    import type { MediaItemToUpload } from '$lib/models/album';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';
    import { enrichWithPreviousVersionIds } from '$lib/utils/uploadUtils';

    interface Props {
        albumPath: string;
        /** So that the edit page can tell me whether it allows dropping */
        allowDrop?: boolean;
    }

    let { albumPath, allowDrop = true }: Props = $props();

    let dialog = $state() as UploadReplaceConfirmDialog;

    let imagesToUpload: MediaItemToUpload[] = $state([]);

    function isDropAllowed(e: DragEvent): boolean {
        return allowDrop && sessionStore.isAdmin && !!e.dataTransfer?.types.includes('Files');
    }

    async function onDrop(e: DragEvent): Promise<void> {
        const files = await getDroppedFiles(e);
        imagesToUpload = getSanitizedFiles(files, albumPath);
        if (!imagesToUpload || !imagesToUpload.length) return;
        const album = albumState.albums.get(albumPath)?.album;
        const collidingNames = enrichWithPreviousVersionIds(imagesToUpload, album);
        if (collidingNames.length > 0) {
            dialog.show(collidingNames);
        } else {
            uploadMachine.uploadMediaItems(albumPath, imagesToUpload);
        }
    }

    function onConfirm(): void {
        uploadMachine.uploadMediaItems(albumPath, imagesToUpload);
    }
</script>

<FullScreenDropZone {isDropAllowed} {onDrop}>Drop image and videos or a 📁</FullScreenDropZone>
<UploadReplaceConfirmDialog bind:this={dialog} {onConfirm} />
