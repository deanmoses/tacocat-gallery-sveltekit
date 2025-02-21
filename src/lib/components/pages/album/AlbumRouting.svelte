<!--
  @component 
  
  Route to the different loading / error / display statuses of an album
-->
<script lang="ts">
    import AlbumLoadingPage from '$lib/components/pages/album/AlbumLoadingPage.svelte';
    import AlbumErrorPage from '$lib/components/pages/album/AlbumErrorPage.svelte';
    import { AlbumStatus } from '$lib/models/album';
    import HomeIcon from '$lib/components/site/icons/HomeIcon.svelte';
    import AlbumProcessingPage from './AlbumProcessingPage.svelte';
    import type { Snippet } from 'svelte';
    import { albumState } from '$lib/stores/AlbumState.svelte';

    interface Props {
        albumPath: string;
        loaded?: Snippet;
    }
    let { albumPath, loaded }: Props = $props();
    let status = $derived(albumState.albums.get(albumPath)?.status);
</script>

{#if !status}
    <AlbumLoadingPage />
{:else if AlbumStatus.CREATING === status}
    <AlbumErrorPage>Creating...</AlbumErrorPage>
{:else if AlbumStatus.DELETING === status}
    <AlbumProcessingPage title="Delete in progress" />
{:else if AlbumStatus.RENAMING === status}
    <AlbumProcessingPage title="Rename in progress" />
{:else if AlbumStatus.NOT_LOADED === status}
    <AlbumLoadingPage />
{:else if AlbumStatus.LOADING === status}
    <AlbumLoadingPage />
{:else if AlbumStatus.LOADED === status}
    {@render loaded?.()}
{:else if AlbumStatus.LOAD_ERRORED === status}
    <AlbumErrorPage>Error retrieving album</AlbumErrorPage>
{:else if AlbumStatus.DOES_NOT_EXIST === status}
    <AlbumErrorPage title="Album Not Found">
        <p>Album does not exist.</p>
        <p><a href="/">Go back <HomeIcon />?</a></p>
    </AlbumErrorPage>
{:else}
    <AlbumErrorPage>Unknown album status: {status}</AlbumErrorPage>
{/if}
