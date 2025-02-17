<!--
  @component
  
  Route to the different loading / error / display statuses of a photo
-->
<script lang="ts">
    import { AlbumLoadStatus, DeleteStatus, RenameStatus, UploadState } from '$lib/models/album';
    import ImageLoadingPage from '$lib/components/pages/image/ImageLoadingPage.svelte';
    import HomeIcon from '$lib/components/site/icons/HomeIcon.svelte';
    import type { Image } from '$lib/models/GalleryItemInterfaces';
    import ImageProcessingPage from './ImageProcessingPage.svelte';
    import AlbumErrorPage from '../album/AlbumErrorPage.svelte';
    import type { Snippet } from 'svelte';
    import { albumState, getUpload } from '$lib/stores/AlbumState.svelte';

    interface Props {
        albumPath: string;
        imagePath: string;
        image: Image | undefined;
        loaded?: Snippet;
    }
    let { albumPath, imagePath, image, loaded }: Props = $props();

    let albumLoadStatus = $derived(albumState.albums.get(albumPath)?.loadStatus);
    let uploadStatus = $derived(getUpload(imagePath)?.status);
    let renameStatus = $derived(albumState.imageRenames.get(imagePath)?.status);
    let deleteStatus = $derived(albumState.imageDeletes.get(imagePath)?.status);
</script>

{#if uploadStatus}
    {#if UploadState.UPLOAD_NOT_STARTED === uploadStatus}
        <ImageProcessingPage title="Upload Not Started" />
    {:else if UploadState.UPLOADING === uploadStatus}
        <ImageProcessingPage title="Upload In Progress" />
    {:else if UploadState.PROCESSING === uploadStatus}
        <ImageProcessingPage title="Upload Processing" />
    {/if}
{:else if RenameStatus.IN_PROGRESS === renameStatus}
    <ImageProcessingPage title="Rename In Progress" />
{:else if DeleteStatus.IN_PROGRESS === deleteStatus}
    <ImageProcessingPage title="Delete In Progress" />
{:else if AlbumLoadStatus.NOT_LOADED === albumLoadStatus}
    <ImageLoadingPage />
{:else if AlbumLoadStatus.LOADING === albumLoadStatus}
    <ImageLoadingPage />
{:else if AlbumLoadStatus.LOADED === albumLoadStatus}
    {#if image}
        {@render loaded?.()}
    {:else}
        <AlbumErrorPage title="Image Not Found">
            <p>Image not found</p>
            <p><a href="/">Go back <HomeIcon title="Home" />?</a></p>
        </AlbumErrorPage>
    {/if}
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
    Unknown status: [{albumLoadStatus}]
{/if}
