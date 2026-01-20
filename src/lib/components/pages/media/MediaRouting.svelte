<!--
  @component

  Route to the different loading / error / display statuses of a media item (image or video)
-->
<script lang="ts">
    import { AlbumLoadStatus, DeleteStatus, RenameStatus, UploadState } from '$lib/models/album';
    import MediaLoadingPage from './MediaLoadingPage.svelte';
    import HomeIcon from '$lib/components/site/icons/HomeIcon.svelte';
    import type { Media } from '$lib/models/GalleryItemInterfaces';
    import MediaProcessingPage from './MediaProcessingPage.svelte';
    import AlbumErrorPage from '../album/AlbumErrorPage.svelte';
    import type { Snippet } from 'svelte';
    import { albumState, getUpload } from '$lib/stores/AlbumState.svelte';

    interface Props {
        albumPath: string;
        mediaPath: string;
        media: Media | undefined;
        loaded?: Snippet;
    }
    let { albumPath, mediaPath, media, loaded }: Props = $props();

    let albumLoadStatus = $derived(albumState.albums.get(albumPath)?.loadStatus);
    let uploadStatus = $derived(getUpload(mediaPath)?.status);
    let renameStatus = $derived(albumState.mediaRenames.get(mediaPath)?.status);
    let deleteStatus = $derived(albumState.mediaDeletes.get(mediaPath)?.status);
</script>

{#if uploadStatus}
    {#if UploadState.UPLOAD_NOT_STARTED === uploadStatus}
        <MediaProcessingPage title="Upload Not Started" />
    {:else if UploadState.UPLOADING === uploadStatus}
        <MediaProcessingPage title="Upload In Progress" />
    {:else if UploadState.PROCESSING === uploadStatus}
        <MediaProcessingPage title="Upload Processing" />
    {/if}
{:else if RenameStatus.IN_PROGRESS === renameStatus}
    <MediaProcessingPage title="Rename In Progress" />
{:else if DeleteStatus.IN_PROGRESS === deleteStatus}
    <MediaProcessingPage title="Delete In Progress" />
{:else if AlbumLoadStatus.NOT_LOADED === albumLoadStatus}
    <MediaLoadingPage />
{:else if AlbumLoadStatus.LOADING === albumLoadStatus}
    <MediaLoadingPage />
{:else if AlbumLoadStatus.LOADED === albumLoadStatus}
    {#if media}
        {@render loaded?.()}
    {:else}
        <AlbumErrorPage title="Media Not Found">
            <p>Media not found</p>
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
