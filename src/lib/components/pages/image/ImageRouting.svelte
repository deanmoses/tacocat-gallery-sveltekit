<!--
  @component Flip through different album loading statuses of a photo
-->
<script lang="ts">
    import { AlbumLoadStatus } from '$lib/models/album';
    import ImageLoadingPage from '$lib/components/pages/image/ImageLoadingPage.svelte';
    import AlbumErrorPage from '../album/AlbumErrorPage.svelte';
    import HomeIcon from '$lib/components/site/icons/HomeIcon.svelte';
    import type { Image } from '$lib/models/GalleryItemInterfaces';

    export let image: Image | undefined;
    export let albumLoadStatus: AlbumLoadStatus | undefined;
</script>

{#if AlbumLoadStatus.NOT_LOADED === albumLoadStatus}
    <ImageLoadingPage />
{:else if AlbumLoadStatus.LOADING === albumLoadStatus}
    <ImageLoadingPage />
{:else if AlbumLoadStatus.LOADED === albumLoadStatus && image}
    <slot name="loaded" />
{:else if AlbumLoadStatus.LOADED === albumLoadStatus && !image}
    <AlbumErrorPage title="Image Not Found">
        <p>Image not found</p>
        <p><a href="/">Go back <HomeIcon title="Home" />?</a></p>
    </AlbumErrorPage>
{:else if AlbumLoadStatus.ERROR_LOADING === albumLoadStatus}
    <AlbumErrorPage>
        <p>Error retrieving album</p>
        <p><a href="/">Go back <HomeIcon title="Home" />?</a></p>
    </AlbumErrorPage>
{:else if AlbumLoadStatus.DOES_NOT_EXIST === albumLoadStatus}
    <AlbumErrorPage title="Album Not Found">
        <p>Album not found</p>
        <p><a href="/">Go back <HomeIcon title="Home" />?</a></p>
    </AlbumErrorPage>
{:else}
    Unknown status: {albumLoadStatus}
{/if}
