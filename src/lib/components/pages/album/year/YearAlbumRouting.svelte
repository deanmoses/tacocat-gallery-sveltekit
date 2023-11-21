<!--
  @component Flip through different statuses of a year album
-->
<script lang="ts">
    import YearAlbumLoadingPage from '$lib/components/pages/album/year/YearAlbumLoadingPage.svelte';
    import AlbumErrorPage from '$lib/components/pages/album/AlbumErrorPage.svelte';
    import { AlbumLoadStatus } from '$lib/models/album';

    export let status: AlbumLoadStatus;
</script>

{#if AlbumLoadStatus.NOT_LOADED === status}
    <YearAlbumLoadingPage />
{:else if AlbumLoadStatus.LOADING === status}
    <YearAlbumLoadingPage />
{:else if AlbumLoadStatus.LOADED === status}
    <slot name="loaded" />
{:else if AlbumLoadStatus.ERROR_LOADING === status}
    <AlbumErrorPage>Error retrieving album</AlbumErrorPage>
{:else if AlbumLoadStatus.DOES_NOT_EXIST === status}
    <AlbumErrorPage>
        <p>Album does not exist</p>
        <p><a href="/">Go back home?</a></p>
    </AlbumErrorPage>
{:else}
    Unknown album status: {status}
{/if}
