<!--
  @component Flip through different statuses of a day album
-->
<script lang="ts">
    import AlbumLoadingPage from '$lib/components/pages/album/AlbumLoadingPage.svelte';
    import AlbumErrorPage from '$lib/components/pages/album/AlbumErrorPage.svelte';
    import { AlbumLoadStatus } from '$lib/models/album';
    import HomeIcon from '$lib/components/site/icons/HomeIcon.svelte';
    import { RenameState, type AlbumRenameEntry } from '$lib/stores/AlbumRenameStore';
    import AlbumProcessingPage from '../AlbumProcessingPage.svelte';
    import type { AlbumDeleteEntry } from '$lib/stores/AlbumDeleteStore';

    export let loadStatus: AlbumLoadStatus;
    export let deleteEntry: AlbumDeleteEntry | undefined = undefined;
    export let renameEntry: AlbumRenameEntry | undefined = undefined;
</script>

{#if deleteEntry}
    <AlbumProcessingPage title="Delete in progress" />
{:else if renameEntry}
    {#if RenameState.IN_PROGRESS === renameEntry.status}
        <AlbumProcessingPage title="Rename in progress" />
    {:else if RenameState.ERROR === renameEntry.status}
        <AlbumErrorPage title="Error Renaming">Error: {renameEntry.errorMessage}</AlbumErrorPage>
    {/if}
{:else if AlbumLoadStatus.NOT_LOADED === loadStatus}
    <AlbumLoadingPage />
{:else if AlbumLoadStatus.LOADING === loadStatus}
    <AlbumLoadingPage />
{:else if AlbumLoadStatus.LOADED === loadStatus}
    <slot name="loaded" />
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
