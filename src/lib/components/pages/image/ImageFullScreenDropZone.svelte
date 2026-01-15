<!--
  @component 
  
  Full screen drag/drop zone for dropping a replacement image onto the image page.
-->
<script lang="ts">
    import FullScreenDropZone from '$lib/components/site/admin/FullScreenDropZone.svelte';
    import { getDroppedImages } from '$lib/stores/admin/DragDropUtils';
    import { uploadMachine } from '$lib/stores/admin/UploadMachine.svelte';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';
    import { getUploadPathForReplacement } from '$lib/utils/uploadUtils';
    import { toast } from '@zerodevx/svelte-toast';

    interface Props {
        imagePath: string;
        /** Current versionId of the image being replaced (for detecting when replacement is complete) */
        versionId?: string;
        /** So that the edit page can tell me whether it allows dropping */
        allowDrop?: boolean;
    }

    let { imagePath, versionId, allowDrop = true }: Props = $props();

    function isDropAllowed(e: DragEvent): boolean {
        return allowDrop && sessionStore.isAdmin && !!e.dataTransfer?.types.includes('Files');
    }

    async function onDrop(e: DragEvent): Promise<void> {
        const files = await getDroppedImages(e);
        if (!files || files.length !== 1) {
            toast.push('Please drop a single image');
            return;
        }
        const uploadPath = getUploadPathForReplacement(imagePath, files[0].name);
        uploadMachine.uploadImage(uploadPath, files[0], versionId);
    }
</script>

<FullScreenDropZone {isDropAllowed} {onDrop}>Drop a replacement image</FullScreenDropZone>
