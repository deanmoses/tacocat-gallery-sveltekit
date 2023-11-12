<!--
  @component

  Flip through different statuses of the root album
-->
<script lang="ts">
    import AlbumLoadingPage from '$lib/components/pages/album/AlbumLoadingPage.svelte';
    import RootAlbumPage from '$lib/components/pages/album/root/RootAlbumPage.svelte';
    import AlbumErrorPage from '$lib/components/pages/album/AlbumErrorPage.svelte';
    import { AlbumLoadStatus } from '$lib/models/album';
    import type { Album } from '$lib/models/impl/GalleryItemInterfaces';

    export let status: AlbumLoadStatus;
    export let album: Album;
</script>

{#if status === AlbumLoadStatus.NOT_LOADED || status === AlbumLoadStatus.LOADING}
    <AlbumLoadingPage />
{:else if status === AlbumLoadStatus.ERROR_LOADING}
    <AlbumErrorPage>Error retrieving album</AlbumErrorPage>
{:else if status === AlbumLoadStatus.LOADED}
    <RootAlbumPage {album} />
{:else if status === AlbumLoadStatus.DOES_NOT_EXIST}
    <AlbumErrorPage>Album does not exist</AlbumErrorPage>
{:else}
    Unknown album status: {status}
{/if}
