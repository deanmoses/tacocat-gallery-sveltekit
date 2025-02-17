<!--
  @component 
  
  Button to create new day album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import CreateIcon from '$lib/components/site/icons/CreateIcon.svelte';
    import { albumLoadMachine } from '$lib/stores/AlbumLoadMachine.svelte';
    import { albumCreateMachine } from '$lib/stores/admin/AlbumCreateMachine.svelte';
    import { isValidDayAlbumPath, isValidYearAlbumPath, sanitizeDayAlbumName } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';
    import TextDialog from './TextDialog.svelte';

    let albumPath: string = $derived(page.url.pathname + '/');
    let show: boolean = $derived(isValidYearAlbumPath(albumPath)); // Show this button only on year albums

    let dialog = $state() as TextDialog;

    function todayAlbumName(): string {
        const d = new Date();
        const month = ('0' + (d.getMonth() + 1)).slice(-2);
        const day = ('0' + d.getDate()).slice(-2);
        const month_day = `${month}-${day}`;
        return month_day;
    }

    function onButtonClick() {
        dialog.show();
    }

    function onNewAlbumName(newAlbumName: string) {
        const newAlbumPath = albumNameToPath(newAlbumName);
        albumCreateMachine.createAlbum(newAlbumPath);
        goto(newAlbumPath);
    }

    async function validateDayAlbumName(albumName: string): Promise<string | undefined> {
        const newAlbumPath = albumNameToPath(albumName);
        if (!isValidDayAlbumPath(newAlbumPath)) return 'invalid album name';
        if (await albumLoadMachine.albumExists(newAlbumPath)) return 'already exists';
    }

    function albumNameToPath(albumName: string): string {
        return albumPath + albumName + '/';
    }
</script>

{#if show}
    <ControlStripButton onclick={onButtonClick}><CreateIcon />New Album</ControlStripButton>
    <TextDialog
        label="New Album Name"
        bind:this={dialog}
        onNewValue={onNewAlbumName}
        sanitizor={sanitizeDayAlbumName}
        validator={validateDayAlbumName}
        initialValue={todayAlbumName()}
    />
{/if}
