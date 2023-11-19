<!--
  @component Button to create new album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import CreateIcon from '$lib/components/site/icons/CreateIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { isValidYearAlbumPath, sanitizeDayAlbumName } from '$lib/utils/galleryPathUtils';
    import ControlStripButton from '../../controls/buttons/ControlStripButton.svelte';
    import TextDialog from './TextDialog.svelte';

    let show: boolean = false;
    $: show = $page.url.pathname === '/'; // Show this button only on root album

    let dialog: TextDialog;

    function yearAlbumName(): string {
        const d = new Date();
        return d.getFullYear().toString();
    }

    function onButtonClick() {
        dialog.show();
    }

    async function onNewAlbumName(e: CustomEvent<{ value: string }>) {
        const newAlbumPath = '/' + e.detail.value + '/';
        await albumStore.createAlbum(newAlbumPath);
        goto(newAlbumPath);
    }

    async function validateYearAlbumName(albumName: string): Promise<string | undefined> {
        const newAlbumPath = '/' + albumName + '/';
        if (!isValidYearAlbumPath(newAlbumPath)) return 'not a year, bruh';
        if (await albumStore.albumExists(newAlbumPath)) return 'already exists';
    }
</script>

{#if show}
    <ControlStripButton on:click={onButtonClick}><CreateIcon />New Year Album</ControlStripButton>
    <TextDialog
        label="New Year!"
        bind:this={dialog}
        on:newValue={onNewAlbumName}
        sanitizor={sanitizeDayAlbumName}
        validator={validateYearAlbumName}
        initialValue={yearAlbumName()}
    />
{/if}
