<!--
  @component 

  Full screen drag/drop zone for dropping a replacement file onto the media page.
-->
<script lang="ts">
    import FullScreenDropZone from '$lib/components/site/admin/FullScreenDropZone.svelte';
    import { getDroppedFiles } from '$lib/stores/admin/DragDropUtils';
    import { uploadMachine } from '$lib/stores/admin/UploadMachine.svelte';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';
    import { getUploadPathForReplacement } from '$lib/utils/uploadUtils';
    import { toast } from '@zerodevx/svelte-toast';

    interface Props {
        mediaPath: string;
        /** Current versionId of the media being replaced (for detecting when replacement is complete) */
        versionId?: string;
        /** So that the edit page can tell me whether it allows dropping */
        allowDrop?: boolean;
    }

    let { mediaPath, versionId, allowDrop = true }: Props = $props();

    function isDropAllowed(e: DragEvent): boolean {
        return allowDrop && sessionStore.isAdmin && !!e.dataTransfer?.types.includes('Files');
    }

    async function onDrop(e: DragEvent): Promise<void> {
        const files = await getDroppedFiles(e);
        if (!files || files.length !== 1) {
            toast.push('Please drop a single file');
            return;
        }
        const uploadPath = getUploadPathForReplacement(mediaPath, files[0].name);
        uploadMachine.uploadMediaItem(uploadPath, files[0], versionId);
    }
</script>

<FullScreenDropZone {isDropAllowed} {onDrop}>Drop a replacement file</FullScreenDropZone>
