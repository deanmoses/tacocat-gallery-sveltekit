<!--
  @component Button to create new album
-->
<script lang="ts">
    import { run } from 'svelte/legacy';

    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import CreateIcon from '$lib/components/site/icons/CreateIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { createAlbum } from '$lib/stores/admin/AlbumCreateStoreLogic';
    import { isValidYearAlbumPath, sanitizeDayAlbumName } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';
    import TextDialog from './TextDialog.svelte';

    let show: boolean = $state(false);
    run(() => {
        show = page.url.pathname === '/';
    }); // Show this button only on root album

    let dialog: TextDialog = $state();

    function yearAlbumName(): string {
        const d = new Date();
        return d.getFullYear().toString();
    }

    function onButtonClick() {
        dialog.show();
    }

    async function onNewAlbumName(e: CustomEvent<{ value: string }>) {
        const newAlbumPath = '/' + e.detail.value + '/';
        await createAlbum(newAlbumPath);
        goto(newAlbumPath);
    }

    async function validateYearAlbumName(albumName: string): Promise<string | undefined> {
        const newAlbumPath = '/' + albumName + '/';
        if (!isValidYearAlbumPath(newAlbumPath)) return 'not a year, bruh';
        if (await albumStore.albumExists(newAlbumPath)) return 'already exists';
    }
</script>

{#if show}
    <ControlStripButton onclick={onButtonClick}><CreateIcon />New Year Album</ControlStripButton>
    <TextDialog
        label="New Year!"
        bind:this={dialog}
        on:newValue={onNewAlbumName}
        sanitizor={sanitizeDayAlbumName}
        validator={validateYearAlbumName}
        initialValue={yearAlbumName()}
    />
{/if}
