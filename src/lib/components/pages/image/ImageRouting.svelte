<!--
  @component Route to the different loading statuses of a photo
-->
<script lang="ts">
    import { AlbumLoadStatus } from '$lib/models/album';
    import ImageLoadingPage from '$lib/components/pages/image/ImageLoadingPage.svelte';
    import AlbumErrorPage from '../album/AlbumErrorPage.svelte';
    import HomeIcon from '$lib/components/site/icons/HomeIcon.svelte';
    import { UploadState, type UploadEntry } from '$lib/stores/UploadStore';
    import { RenameState, type RenameEntry } from '$lib/stores/ImageRenameStore';
    import type { Image } from '$lib/models/GalleryItemInterfaces';
    import ImageErrorPage from './ImageErrorPage.svelte';
    import ImageProcessingPage from './ImageProcessingPage.svelte';

    export let image: Image | undefined;
    export let albumLoadStatus: AlbumLoadStatus | undefined;
    export let rename: RenameEntry | undefined;
    export let upload: UploadEntry | undefined;
</script>

{#if rename}
    {#if RenameState.IN_PROGRESS === rename?.status}
        <ImageProcessingPage title="Rename In Progress" />
    {:else if RenameState.ERROR === rename?.status}
        <ImageErrorPage title="Error Renaming">Error renaming: {rename?.errorMessage}</ImageErrorPage>
    {/if}
{:else if upload}
    {#if UploadState.UPLOAD_NOT_STARTED === upload.status}
        <ImageProcessingPage title="Upload Not Started" />
    {:else if UploadState.UPLOADING === upload.status}
        <ImageProcessingPage title="Upload In Progress" />
    {:else if UploadState.PROCESSING === upload.status}
        <ImageProcessingPage title="Upload Processing" />
    {/if}
{:else if AlbumLoadStatus.NOT_LOADED === albumLoadStatus}
    <ImageLoadingPage />
{:else if AlbumLoadStatus.LOADING === albumLoadStatus}
    <ImageLoadingPage />
{:else if AlbumLoadStatus.LOADED === albumLoadStatus}
    {#if image}
        <slot name="loaded" />
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
