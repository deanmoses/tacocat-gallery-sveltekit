<!--
  @component 
  
  Flip through different statuses of a year album
-->
<script lang="ts">
    import YearAlbumLoadingPage from '$lib/components/pages/album/year/YearAlbumLoadingPage.svelte';
    import AlbumErrorPage from '$lib/components/pages/album/AlbumErrorPage.svelte';
    import { AlbumLoadStatus, CreateStatus, DeleteStatus } from '$lib/models/album';
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
    let deleteStatus = $derived(albumState.albumDeletes.get(albumPath)?.status);
</script>

{#if CreateStatus.IN_PROGRESS === createStatus}
    <AlbumErrorPage>Creating...</AlbumErrorPage>
{:else if !loadStatus}
    <YearAlbumLoadingPage />
{:else if DeleteStatus.IN_PROGRESS === deleteStatus}
    <AlbumProcessingPage title="Delete in progress" />
{:else if AlbumLoadStatus.NOT_LOADED === loadStatus}
    <YearAlbumLoadingPage />
{:else if AlbumLoadStatus.LOADING === loadStatus}
    <YearAlbumLoadingPage />
{:else if AlbumLoadStatus.LOADED === loadStatus}
    {@render loaded?.()}
{:else if AlbumLoadStatus.ERROR_LOADING === loadStatus}
    <AlbumErrorPage>Error retrieving album</AlbumErrorPage>
{:else if AlbumLoadStatus.DOES_NOT_EXIST === loadStatus}
    <AlbumErrorPage>
        <p>Album does not exist</p>
        <p><a href="/">Go back home?</a></p>
    </AlbumErrorPage>
{:else}
    <AlbumErrorPage>Unknown album status: {loadStatus}</AlbumErrorPage>
{/if}
