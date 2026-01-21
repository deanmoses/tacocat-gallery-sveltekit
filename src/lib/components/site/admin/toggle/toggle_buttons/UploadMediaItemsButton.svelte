<!--
  @component

  Button to upload multiple media items (images or videos) on a day album page
-->
<script lang="ts">
    import { page } from '$app/state';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';
    import type { MediaItemToUpload } from '$lib/models/album';
    import { albumState } from '$lib/stores/AlbumState.svelte';
    import { getSanitizedFiles, uploadMachine } from '$lib/stores/admin/UploadMachine.svelte';
    import { isValidDayAlbumPath, validMediaExtensionsString } from '$lib/utils/galleryPathUtils';
    import { enrichWithPreviousVersionIds } from '$lib/utils/uploadUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';
    import UploadReplaceConfirmDialog from './UploadReplaceConfirmDialog.svelte';

    let albumPath = $derived(page.url.pathname + '/');
    let show = $derived(isValidDayAlbumPath(albumPath)); // Show this button only on day ablums

    let fileInput = $state() as HTMLInputElement;
    let dialog = $state() as UploadReplaceConfirmDialog;
    let imagesToUpload: MediaItemToUpload[] = $state([]);

    function onUploadButtonClick() {
        fileInput.click();
    }

    function onFilesSelected() {
        if (!fileInput.files) return;
        if (!isValidDayAlbumPath(albumPath)) throw new Error(`Invalid day album path: [${albumPath}]`);
        console.log(`I'll upload [${fileInput.files.length}] images to album [${albumPath}]`);
        imagesToUpload = getSanitizedFiles(fileInput.files, albumPath);
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

{#if show}
    <ControlStripButton onclick={onUploadButtonClick}><UploadIcon />Upload</ControlStripButton>
    <input
        bind:this={fileInput}
        onchange={onFilesSelected}
        type="file"
        multiple
        accept={validMediaExtensionsString()}
        style="display:none"
    />
    <UploadReplaceConfirmDialog bind:this={dialog} {onConfirm} />
{/if}
