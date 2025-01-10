<!--
  @component 
  
  Page to edit a day album
-->
<script lang="ts">
    import DayAlbumPageLayout from './DayAlbumPageLayout.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import Thumbnail from '$lib/components/site/Thumbnail.svelte';
    import SelectableStar from '$lib/components/site/admin/SelectableStar.svelte';
    import AlbumEditControls from '$lib/components/site/admin/edit_controls/AlbumEditControls.svelte';
    import EditableHtml from '$lib/components/site/admin/EditableHtml.svelte';
    import { editUrl } from '$lib/utils/path-utils';
    import DraftStore from '$lib/stores/DraftStore';
    import { setAlbumThumbnail } from '$lib/stores/admin/AlbumThumbnailLogic';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import DayAlbumFullScreenDropZone from './DayAlbumFullScreenDropZone.svelte';
    import type { UploadEntry } from '$lib/models/album';
    import UploadThumbnail from '$lib/components/site/admin/UploadThumbnail.svelte';

    interface Props {
        album: Album;
        uploads?: UploadEntry[] | undefined;
    }

    let { album, uploads = undefined }: Props = $props();

    let okToNavigate = DraftStore.getOkToNavigate();

    async function albumThumbnailSelected(e: CustomEvent<{ path: string }>) {
        const imagePath = e.detail.path;
        await setAlbumThumbnail(album.path, imagePath);
    }
</script>

<DayAlbumPageLayout title={album.title} published={album.published}>
    {#snippet editControls()}
        <AlbumEditControls showSummary summary={album.summary} published={album.published} />
    {/snippet}

    {#snippet nav()}
        <PrevButton href={$okToNavigate ? editUrl(album.nextHref) : undefined} title={album.nextTitle} />
        <UpButton href={$okToNavigate ? editUrl(album.parentHref) : undefined} title={album.parentTitle} />
        <NextButton href={$okToNavigate ? editUrl(album.prevHref) : undefined} title={album.prevTitle} />
    {/snippet}

    {#snippet caption()}
        <EditableHtml htmlContent={album.description} />
    {/snippet}

    {#snippet thumbnails()}
        {#if album.images?.length}
            {#each album.images as image (image.path)}
                {#if $okToNavigate}
                    <Thumbnail
                        title={image.title}
                        summary={image.summary}
                        href={editUrl(`${image.path}`)}
                        src={image.thumbnailUrl}
                    >
                        {#snippet selectionControls()}
                            <SelectableStar
                                albumThumbPath={album.thumbnailPath}
                                path={image.path}
                                on:selected={albumThumbnailSelected}
                            />
                        {/snippet}
                    </Thumbnail>
                {:else}
                    <div title="💾 Save changes before navigating">
                        <Thumbnail title={image.title} summary={image.summary} src={image.thumbnailUrl} />
                    </div>
                {/if}
            {/each}
        {:else if !album.published && !uploads?.length && $okToNavigate}
            <p>Drop images or a 📁</p>
        {/if}
        {#if uploads?.length}
            <!-- 
                  Lazy / async / dynamic load the component
                  It's a hint to the bundling system that it can be put into a separate bundle, 
                  so that non-admins aren't forced to download the code.
              -->
            {#each uploads as upload (upload.imagePath)}
                <UploadThumbnail {upload} />
            {/each}
        {/if}
    {/snippet}
</DayAlbumPageLayout>
<DayAlbumFullScreenDropZone albumPath={album.path} allowDrop={$okToNavigate} />

<style>
    div {
        cursor: not-allowed;
    }
    :global(.thumbnail:hover .notSelected) {
        animation: fadeIn 1400ms;
        display: inherit;
    }
    @keyframes fadeIn {
        0% {
            opacity: 0;
        }
        25% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
</style>
