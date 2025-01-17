<!--
  @component 
  
  Button to rename a day album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import RenameIcon from '$lib/components/site/icons/RenameIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { renameDayAlbum } from '$lib/stores/admin/AlbumRenameStoreLogic';
    import {
        getNameFromPath,
        getParentFromPath,
        isValidDayAlbumPath,
        sanitizeDayAlbumName,
    } from '$lib/utils/galleryPathUtils';
    import { toast } from '@zerodevx/svelte-toast';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';
    import TextDialog from './TextDialog.svelte';

    let albumPath: string = $derived(page.url.pathname + '/');
    let show: boolean = $derived(isValidDayAlbumPath(albumPath)); // Show this button only on day albums
    let dialog = $state() as TextDialog;

    function originalName(): string {
        const albumName = getNameFromPath(albumPath);
        if (!albumName) throw 'no albumName';
        return albumName;
    }

    function onButtonClick() {
        dialog.show();
    }

    async function onNewAlbumName(newAlbumName: string) {
        const newAlbumPath = albumNameToPath(newAlbumName);
        try {
            await renameDayAlbum(albumPath, newAlbumPath);
            goto(newAlbumPath);
        } catch (e) {
            toast.push(`Error renaming album: ${e}`);
        }
    }

    async function validateDayAlbumName(albumName: string): Promise<string | undefined> {
        const newAlbumPath = albumNameToPath(albumName);
        if (!isValidDayAlbumPath(newAlbumPath)) return 'invalid album name';
        if (await albumStore.albumExists(newAlbumPath)) return 'already exists';
    }

    function albumNameToPath(albumName: string): string {
        return getParentFromPath(albumPath) + albumName + '/';
    }
</script>

{#if show}
    <ControlStripButton onclick={onButtonClick} title="Rename album on disk"><RenameIcon />Rename</ControlStripButton>
    <TextDialog
        label="New Album Name"
        bind:this={dialog}
        onNewValue={onNewAlbumName}
        sanitizor={sanitizeDayAlbumName}
        validator={validateDayAlbumName}
        initialValue={originalName()}
    />
{/if}
