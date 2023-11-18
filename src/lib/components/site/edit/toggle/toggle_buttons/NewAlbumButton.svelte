<!--
  @component Button to create a new album
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';
    import { albumStore } from '$lib/stores/AlbumStore';
    import { isValidAlbumPath, isValidImagePath, isValidYearAlbumPath } from '$lib/utils/galleryPathUtils';
    import MyDialog from './TextDialog.svelte';

    let path: string;
    $: path = $page.url.pathname;

    // Show this button only on year ablums
    let show: boolean = false;
    $: show = isValidYearAlbumPath($page.url.pathname + '/');

    let dialog: MyDialog;

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

    async function onNewAlbumName(e: CustomEvent<{ value: string }>) {
        const newName = e.detail.value;
        console.log('Outer close dialog results', newName);
        let thePath = path;
        if (!isValidImagePath(thePath)) {
            thePath = thePath + '/';
            if (!isValidAlbumPath(thePath)) throw new Error(`Invalid path [${thePath}]`);
        }
        const newAlbumPath = thePath + newName + '/';
        await albumStore.createAlbum(newAlbumPath);
        goto(newAlbumPath);
    }
</script>

{#if show}
    <button on:click={onButtonClick}><SaveIcon />New Album</button>
    <MyDialog bind:this={dialog} on:newValue={onNewAlbumName} label="New Album Name" initialValue={todayAlbumName()} />
{/if}

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
