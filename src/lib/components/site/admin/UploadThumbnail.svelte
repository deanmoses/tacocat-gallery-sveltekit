<!--
  @component

  A thumbnail of an uploading image
-->
<script lang="ts">
    import type { UploadEntry } from '$lib/models/album';
    import { createPreviewUrl } from '$lib/utils/mediaValidation';
    import Thumbnail from '../Thumbnail.svelte';
    import WaitingIcon from '../icons/WaitingIcon.svelte';

    interface Props {
        upload: UploadEntry;
    }

    let { upload }: Props = $props();

    // Create object URL that tracks upload.file changes and cleans up properly
    // For HEIC files, tests if browser can display them (Safari can, others can't)
    let urlForTemplate = $state<string | undefined>(undefined);
    $effect(() => {
        let active = true;
        let currentUrl = '';
        createPreviewUrl(upload.file).then((url) => {
            if (!active) {
                // Effect was cleaned up before promise resolved
                if (url) URL.revokeObjectURL(url);
                return;
            }
            currentUrl = url;
            urlForTemplate = url || undefined;
        });
        return () => {
            active = false;
            if (currentUrl) {
                console.info(`UploadThumbnail: revoking object URL for ${upload.file.name}`);
                URL.revokeObjectURL(currentUrl);
            }
        };
    });
</script>

<Thumbnail title={upload.file.name} src={urlForTemplate} summary={upload.status}>
    {#snippet selectionControls()}
        <div><WaitingIcon height="100px" width="100px" /></div>
    {/snippet}
</Thumbnail>

<style>
    div {
        height: var(--thumbnail-height);
        width: var(--thumbnail-width);
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.5);
    }
</style>
