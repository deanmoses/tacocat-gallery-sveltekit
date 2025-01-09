<!--
  @component Button to rename a day album
-->
<script lang="ts">
  import { run } from 'svelte/legacy';

    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
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

    let albumPath: string = $derived($page.url.pathname + '/');
    

    // Show this button only on day albums
    let show: boolean = $state(false);
    run(() => {
    show = isValidDayAlbumPath(albumPath);
  });

    let dialog: TextDialog = $state();

    function originalName(): string {
        const albumName = getNameFromPath(albumPath);
        if (!albumName) throw 'no albumName';
        return albumName;
    }

    function onButtonClick() {
        dialog.show();
    }

    async function onNewAlbumName(e: CustomEvent<{ value: string }>) {
        const newAlbumPath = albumNameToPath(e.detail.value);
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
    <ControlStripButton on:click={onButtonClick} title="Rename album on disk"><RenameIcon />Rename</ControlStripButton>
    <TextDialog
        label="New Album Name"
        bind:this={dialog}
        on:newValue={onNewAlbumName}
        sanitizor={sanitizeDayAlbumName}
        validator={validateDayAlbumName}
        initialValue={originalName()}
    />
{/if}
