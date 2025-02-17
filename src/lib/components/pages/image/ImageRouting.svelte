<!--
  @component
  
  Route to the different loading / error / display statuses of a photo
-->
<script lang="ts">
    import {
        AlbumLoadStatus,
        UploadState,
        type UploadEntry,
        type RenameEntry,
        type DeleteEntry,
    } from '$lib/models/album';
    import ImageLoadingPage from '$lib/components/pages/image/ImageLoadingPage.svelte';
    import HomeIcon from '$lib/components/site/icons/HomeIcon.svelte';
    import type { Image } from '$lib/models/GalleryItemInterfaces';
    import ImageProcessingPage from './ImageProcessingPage.svelte';
    import AlbumErrorPage from '../album/AlbumErrorPage.svelte';
    import type { Snippet } from 'svelte';
    import { globalStore } from '$lib/stores/GlobalStore.svelte';

    interface Props {
        imagePath: string;
        image: Image | undefined;
        albumLoadStatus: AlbumLoadStatus | undefined;
        loaded?: Snippet;
    }
    let { imagePath, image, albumLoadStatus, loaded }: Props = $props();

    let uploadEntry: UploadEntry | undefined = $derived(globalStore.getUpload(imagePath));
    let renameEntry: RenameEntry | undefined = $derived(globalStore.imageRenames.get(imagePath));
    let deleteEntry: DeleteEntry | undefined = $derived(globalStore.imageDeletes.get(imagePath));
</script>

{#if uploadEntry}
    {#if UploadState.UPLOAD_NOT_STARTED === uploadEntry.status}
        <ImageProcessingPage title="Upload Not Started" />
    {:else if UploadState.UPLOADING === uploadEntry.status}
        <ImageProcessingPage title="Upload In Progress" />
    {:else if UploadState.PROCESSING === uploadEntry.status}
        <ImageProcessingPage title="Upload Processing" />
    {/if}
{:else if renameEntry}
    <ImageProcessingPage title="Rename In Progress" />
{:else if deleteEntry}
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
