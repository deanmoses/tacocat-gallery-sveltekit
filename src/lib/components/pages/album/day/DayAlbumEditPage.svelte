<!--
  @component 
  
  Page to edit a day album
-->
<script lang="ts">
    import DayAlbumPageLayout from './DayAlbumPageLayout.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import ImageThumbnail from '$lib/components/site/ImageThumbnail.svelte';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import type { ImageEntry } from '$lib/models/album';
    import { getUploadsForAlbum } from '$lib/state/AlbumState.svelte';
    import SelectableStar from '$lib/components/site/admin/SelectableStar.svelte';
    import AlbumEditControls from '$lib/components/site/admin/edit_controls/AlbumEditControls.svelte';
    import EditableHtml from '$lib/components/site/admin/EditableHtml.svelte';
    import UploadThumbnail from '$lib/components/site/admin/UploadThumbnail.svelte';
    import { draftMachine } from '$lib/state/admin/DraftMachine.svelte';
    import { albumThumbnailSetMachine } from '$lib/state/admin/AlbumThumbnailSetMachine.svelte';
    import DayAlbumFullScreenDropZone from './DayAlbumFullScreenDropZone.svelte';

    interface Props {
        album: Album;
    }
    let { album }: Props = $props();
    let uploads: ImageEntry[] = $derived(getUploadsForAlbum(album.path));
    let okToNavigate = $derived(draftMachine.okToNavigate);

    function albumThumbnailSelected(newThumbnailImagePath: string) {
        albumThumbnailSetMachine.setAlbumThumbnail(album.path, newThumbnailImagePath);
    }
</script>

<DayAlbumPageLayout title={album.title} published={album.published}>
    {#snippet editControls()}
        <AlbumEditControls showSummary summary={album.summary} published={album.published} />
    {/snippet}

    {#snippet nav()}
        <PrevButton href={okToNavigate ? album.nextHref : undefined} title={album.nextTitle} />
        <UpButton href={okToNavigate ? album.parentHref : undefined} title={album.parentTitle} />
        <NextButton href={okToNavigate ? album.prevHref : undefined} title={album.prevTitle} />
    {/snippet}

    {#snippet caption()}
        <EditableHtml htmlContent={album.description} />
    {/snippet}

    {#snippet thumbnails()}
        {#if album.images?.length}
            {#each album.images as image (image.path)}
                {#if okToNavigate}
                    <ImageThumbnail
                        path={image.path}
                        title={image.title}
                        summary={image.summary}
                        href={image.path}
                        src={image.thumbnailUrl}
                    >
                        {#snippet selectionControls()}
                            <SelectableStar
                                albumThumbPath={album.thumbnailPath}
                                path={image.path}
                                onSelected={albumThumbnailSelected}
                            />
                        {/snippet}
                    </ImageThumbnail>
                {:else}
                    <div title="💾 Save changes before navigating">
                        <ImageThumbnail
                            path={image.path}
                            title={image.title}
                            summary={image.summary}
                            src={image.thumbnailUrl}
                        />
                    </div>
                {/if}
            {/each}
        {:else if !album.published && !uploads?.length && okToNavigate}
            <p>Drop images or a 📁</p>
        {/if}
        {#if uploads?.length}
            {#each uploads as imageEntry (imageEntry.upload?.imagePath)}
                <UploadThumbnail {imageEntry} />
            {/each}
        {/if}
    {/snippet}
</DayAlbumPageLayout>
<DayAlbumFullScreenDropZone albumPath={album.path} allowDrop={okToNavigate} />

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
