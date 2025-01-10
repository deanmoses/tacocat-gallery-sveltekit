<!--
  @component 
  
  Flip through different statuses of a year album
-->
<script lang="ts">
    import YearAlbumLoadingPage from '$lib/components/pages/album/year/YearAlbumLoadingPage.svelte';
    import AlbumErrorPage from '$lib/components/pages/album/AlbumErrorPage.svelte';
    import { AlbumLoadStatus, type DeleteEntry } from '$lib/models/album';
    import AlbumProcessingPage from '../AlbumProcessingPage.svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        loadStatus: AlbumLoadStatus;
        deleteEntry?: DeleteEntry | undefined;
        loaded?: Snippet;
    }

    let { loadStatus, deleteEntry = undefined, loaded }: Props = $props();
</script>

{#if deleteEntry}
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
    Unknown album status: {loadStatus}
{/if}
