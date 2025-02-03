<!--
  @component

  Flip through different statuses of the root album
-->
<script lang="ts">
    import AlbumLoadingPage from '$lib/components/pages/album/AlbumLoadingPage.svelte';
    import RootAlbumPage from '$lib/components/pages/album/root/RootAlbumPage.svelte';
    import AlbumErrorPage from '$lib/components/pages/album/AlbumErrorPage.svelte';
    import { AlbumLoadStatus } from '$lib/models/album';
    import type { Album } from '$lib/models/GalleryItemInterfaces';

    interface Props {
        status: AlbumLoadStatus | undefined;
        album: Album | undefined;
    }
    let { status, album }: Props = $props();
</script>

{#if !status}
    <AlbumLoadingPage />
{:else if AlbumLoadStatus.NOT_LOADED === status}
    <AlbumLoadingPage />
{:else if AlbumLoadStatus.LOADING === status}
    <AlbumLoadingPage />
{:else if AlbumLoadStatus.ERROR_LOADING === status}
    <AlbumErrorPage>Error retrieving album</AlbumErrorPage>
{:else if AlbumLoadStatus.LOADED === status && album}
    <RootAlbumPage {album} />
{:else if AlbumLoadStatus.DOES_NOT_EXIST === status}
    <AlbumErrorPage>Album does not exist</AlbumErrorPage>
{:else}
    Unknown album status: {status}
{/if}
