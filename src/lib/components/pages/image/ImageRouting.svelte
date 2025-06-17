<!--
  @component
  
  Route to the different loading / error / display statuses of a photo
-->
<script lang="ts">
    import { AlbumStatus, ImageStatus } from '$lib/models/album';
    import ImageLoadingPage from '$lib/components/pages/image/ImageLoadingPage.svelte';
    import HomeIcon from '$lib/components/site/icons/HomeIcon.svelte';
    import type { Image } from '$lib/models/GalleryItemInterfaces';
    import ImageProcessingPage from './ImageProcessingPage.svelte';
    import AlbumErrorPage from '../album/AlbumErrorPage.svelte';
    import type { Snippet } from 'svelte';
    import { albumState } from '$lib/state/AlbumState.svelte';

    interface Props {
        albumPath: string;
        imagePath: string;
        image: Image | undefined;
        loaded?: Snippet;
    }
    let { albumPath, imagePath, image, loaded }: Props = $props();

    let albumStatus: AlbumStatus | undefined = $derived(albumState.albums.get(albumPath)?.status);
    let imageStatus: ImageStatus | undefined = $derived(albumState.images.get(imagePath)?.status);
</script>

{#if ImageStatus.UPLOAD_QUEUED === imageStatus}
    <ImageProcessingPage title="Upload Queued..." />
{:else if ImageStatus.UPLOAD_TRANSFERRING === imageStatus}
    <ImageProcessingPage title="Uploading..." />
{:else if ImageStatus.UPLOAD_PROCESSING === imageStatus}
    <ImageProcessingPage title="Upload Processing..." />
{:else if ImageStatus.RENAMING === imageStatus}
    <ImageProcessingPage title="Rename In Progress..." />
{:else if ImageStatus.DELETING === imageStatus}
    <ImageProcessingPage title="Delete In Progress..." />
{:else if albumStatus?.startsWith('LOADED')}
    {#if image}
        {@render loaded?.()}
    {:else}
        <AlbumErrorPage title="Image Not Found">
            <p>Image not found</p>
            <p><a href="/">Go back <HomeIcon title="Home" />?</a></p>
        </AlbumErrorPage>
    {/if}
{:else if AlbumStatus.LOAD_ERRORED === albumStatus}
    <AlbumErrorPage>
        <p>Error retrieving album</p>
        <p><a href="/">Go back <HomeIcon title="Home" />?</a></p>
    </AlbumErrorPage>
{:else if albumStatus?.startsWith('NOT_LOADED')}
    <ImageLoadingPage />
{:else if albumStatus?.startsWith(AlbumStatus.DOES_NOT_EXIST)}
    <AlbumErrorPage title="Album Not Found">
        <p>Album not found</p>
        <p><a href="/">Go back <HomeIcon title="Home" />?</a></p>
    </AlbumErrorPage>
{:else}
    Unknown status: [{albumStatus}]
{/if}
