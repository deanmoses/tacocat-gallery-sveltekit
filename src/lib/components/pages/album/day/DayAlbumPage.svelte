<!--
  @component 
  
  Page displaying a day album
-->
<script lang="ts">
    import DayAlbumPageLayout from './DayAlbumPageLayout.svelte';
    import AdminToggle from '$lib/components/site/admin/toggle/AdminToggle.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import Thumbnail from '$lib/components/site/Thumbnail.svelte';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import type { UploadEntry } from '$lib/models/album';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';

    interface Props {
        album: Album;
        uploads?: UploadEntry[] | undefined;
    }

    let { album, uploads = undefined }: Props = $props();
</script>

<DayAlbumPageLayout title={album.title} published={album.published}>
    {#snippet editControls()}
        <AdminToggle />
    {/snippet}

    {#snippet nav()}
        <PrevButton href={album.nextHref} title={album.nextTitle} />
        <UpButton href={album.parentHref} title={album.parentTitle} />
        <NextButton href={album.prevHref} title={album.prevTitle} />
    {/snippet}

    {#snippet caption()}
        {#if uploads?.length}
            {#await import('./UploadStatus.svelte') then { default: UploadStatus }}
                <UploadStatus {uploads} />
            {/await}
        {:else}
            {@html album.description}
        {/if}
    {/snippet}

    {#snippet thumbnails()}
        {#if album.images?.length}
            {#each album.images as image (image.path)}
                <Thumbnail title={image.title} src={image.thumbnailUrl} summary={image.summary} href={image.href} />
            {/each}
        {:else if !album.published && !uploads?.length}
            <p>Drop images or a 📁</p>
        {/if}
        {#if uploads?.length}
            <!-- 
                  Lazy / async / dynamic load the component
                  It's a hint to the bundling system that it can be put into a separate bundle, 
                  so that non-admins aren't forced to download the code.
              -->
            {#await import('$lib/components/site/admin/UploadThumbnail.svelte') then { default: UploadThumbnail }}
                {#each uploads as upload (upload.imagePath)}
                    <UploadThumbnail {upload} />
                {/each}
            {/await}
        {/if}
    {/snippet}
</DayAlbumPageLayout>

{#if sessionStore.isAdmin}
    <!-- 
        Lazy / async / dynamic load the component
        It's a hint to the bundling system that it can be put into a separate bundle, 
        so that non-admins aren't forced to download the code.
    -->
    {#await import('./DayAlbumFullScreenDropZone.svelte') then { default: DayAlbumFullScreenDropZone }}
        <DayAlbumFullScreenDropZone albumPath={album.path} />
    {/await}
{/if}
