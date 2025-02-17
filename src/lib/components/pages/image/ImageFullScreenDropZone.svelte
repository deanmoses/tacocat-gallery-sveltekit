<!--
  @component 
  
  Full screen drag/drop zone for dropping a replacement image onto the image page.
-->
<script lang="ts">
    import FullScreenDropZone from '$lib/components/site/admin/FullScreenDropZone.svelte';
    import { getDroppedImages } from '$lib/stores/admin/DragDropUtils';
    import { uploadMachine } from '$lib/stores/admin/UploadMachine.svelte';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';
    import { toast } from '@zerodevx/svelte-toast';

    interface Props {
        imagePath: string;
        /** So that the edit page can tell me whether it allows dropping */
        allowDrop?: boolean;
    }

    let { imagePath, allowDrop = true }: Props = $props();

    function isDropAllowed(e: DragEvent): boolean {
        return allowDrop && sessionStore.isAdmin && !!e.dataTransfer?.types.includes('Files');
    }

    async function onDrop(e: DragEvent): Promise<void> {
        const files = await getDroppedImages(e);
        if (!files || files.length !== 1) {
            toast.push('Please drop a single image');
            return;
        }
        uploadMachine.uploadImage(imagePath, files[0]);
    }
</script>

<FullScreenDropZone {isDropAllowed} {onDrop}>Drop a replacement image</FullScreenDropZone>
