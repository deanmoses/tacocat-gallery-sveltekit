<!--
  @component 
  
  Route to the different loading / error / display statuses of a day album
-->
<script lang="ts">
    import AlbumLoadingPage from '$lib/components/pages/album/AlbumLoadingPage.svelte';
    import AlbumErrorPage from '$lib/components/pages/album/AlbumErrorPage.svelte';
    import { AlbumLoadStatus, CreateStatus, DeleteStatus, RenameStatus } from '$lib/models/album';
    import HomeIcon from '$lib/components/site/icons/HomeIcon.svelte';
    import AlbumProcessingPage from '../AlbumProcessingPage.svelte';
    import type { Snippet } from 'svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

    interface Props {
        albumPath: string;
        loaded?: Snippet;
    }
    let { albumPath, loaded }: Props = $props();
    let loadStatus = $derived(albumState.albums.get(albumPath)?.loadStatus);
    let createStatus = $derived(albumState.albumCreates.get(albumPath)?.status);
    let renameStatus = $derived(albumState.albumRenames.get(albumPath)?.status);
    let deleteStatus = $derived(albumState.albumDeletes.get(albumPath)?.status);
</script>

{#if CreateStatus.IN_PROGRESS === createStatus}
    <AlbumErrorPage>Creating...</AlbumErrorPage>
{:else if DeleteStatus.IN_PROGRESS === deleteStatus}
    <AlbumProcessingPage title="Delete in progress" />
{:else if RenameStatus.IN_PROGRESS === renameStatus}
    <AlbumProcessingPage title="Rename in progress" />
{:else if !loadStatus}
    <AlbumLoadingPage />
{:else if AlbumLoadStatus.NOT_LOADED === loadStatus}
    <AlbumLoadingPage />
{:else if AlbumLoadStatus.LOADING === loadStatus}
    <AlbumLoadingPage />
{:else if AlbumLoadStatus.LOADED === loadStatus}
    {@render loaded?.()}
{:else if AlbumLoadStatus.ERROR_LOADING === loadStatus}
    <AlbumErrorPage>Error retrieving album</AlbumErrorPage>
{:else if AlbumLoadStatus.DOES_NOT_EXIST === loadStatus}
    <AlbumErrorPage title="Album Not Found">
        <p>Album does not exist.</p>
        <p><a href="/">Go back <HomeIcon />?</a></p>
    </AlbumErrorPage>
{:else}
    Unknown album status: {loadStatus}
{/if}
