<!--
  @component Route to the different loading / error / display statuses of a day album
-->
<script lang="ts">
    import AlbumLoadingPage from '$lib/components/pages/album/AlbumLoadingPage.svelte';
    import AlbumErrorPage from '$lib/components/pages/album/AlbumErrorPage.svelte';
    import { AlbumLoadStatus, type DeleteEntry, type RenameEntry } from '$lib/models/album';
    import HomeIcon from '$lib/components/site/icons/HomeIcon.svelte';
    import AlbumProcessingPage from '../AlbumProcessingPage.svelte';

    export let loadStatus: AlbumLoadStatus;
    export let deleteEntry: DeleteEntry | undefined = undefined;
    export let renameEntry: RenameEntry | undefined = undefined;
</script>

{#if deleteEntry}
    <AlbumProcessingPage title="Delete in progress" />
{:else if renameEntry}
    <AlbumProcessingPage title="Rename in progress" />
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
