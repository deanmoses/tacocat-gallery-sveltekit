<script lang="ts">
    import FullScreenDropZone from '$lib/components/site/admin/FullScreenDropZone.svelte';
    import { isAdmin } from '$lib/stores/SessionStore';
    import { getDroppedImages, uploadSingleImage } from '$lib/stores/admin/UploadStoreLogic';
    import { toast } from '@zerodevx/svelte-toast';

    export let imagePath: string;

    /** So that the edit page can tell me whether it allows dropping */
    export let allowDrop: boolean = true;

    let dragging = false;
    $: dragging = dragging;

    function isDropAllowed(e: DragEvent): boolean {
        return allowDrop && $isAdmin && !!e.dataTransfer?.types.includes('Files');
    }

    async function onDrop(e: DragEvent): Promise<void> {
        const files = await getDroppedImages(e);
        if (!files || files.length !== 1) {
            toast.push('Please drop a single image');
            return;
        }
        await uploadSingleImage(files[0], imagePath);
    }
</script>

<FullScreenDropZone {isDropAllowed} {onDrop}>Drop a replacement image</FullScreenDropZone>
