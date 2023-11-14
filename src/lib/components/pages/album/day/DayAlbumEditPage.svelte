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
    import SelectableStar from '$lib/components/site/edit/SelectableStar.svelte';
    import AlbumEditControls from '$lib/components/site/edit/controls/AlbumEditControls.svelte';
    import EditableHtml from '$lib/components/site/edit/EditableHtml.svelte';
    import { editUrl } from '$lib/utils/path-utils';
    import DraftStore from '$lib/stores/DraftStore';
    import { setAlbumThumbnail } from '$lib/stores/AlbumThumbnailHelper';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import { getNameFromPath } from '$lib/utils/galleryPathUtils';

    export let year: string;
    export let album: Album;

    let okToNavigate = DraftStore.getOkToNavigate();

    function albumThumbnailSelected(e: CustomEvent<{ path: string }>) {
        const imagePath = e.detail.path;
        console.log(`<DayAlbumEditPage>: thumbnail ${imagePath}`, e.detail);
        const imageLeafPath = getNameFromPath(imagePath);
        if (imageLeafPath) {
            setAlbumThumbnail(album.path, imageLeafPath);
        } else {
            console.error(`<DayAlbumEditPage>: can't find leaf item on thumbnail ${imagePath}`);
        }
    }
</script>

<DayAlbumPageLayout {year} title={album.title}>
    <svelte:fragment slot="editControls">
        <AlbumEditControls showSummary summary={album.summary} showPublished published={album.published} />
    </svelte:fragment>

    <svelte:fragment slot="title">
        {album.title}
    </svelte:fragment>

    <svelte:fragment slot="nav">
        <PrevButton href={$okToNavigate ? editUrl(album.nextHref) : undefined} title={album.nextTitle} />
        <UpButton href={$okToNavigate ? editUrl(album.parentHref) : undefined} title={album.parentTitle} />
        <NextButton href={$okToNavigate ? editUrl(album.prevHref) : undefined} title={album.prevTitle} />
    </svelte:fragment>

    <svelte:fragment slot="caption">
        <EditableHtml htmlContent={album.description} />
    </svelte:fragment>

    <svelte:fragment slot="thumbnails">
        {#if album.images}
            {#each album.images as image (image.path)}
                {#if $okToNavigate}
                    <Thumbnail
                        title={image.title}
                        summary={image.summary}
                        href={editUrl(`${image.path}`)}
                        src={image.thumbnailUrl}
                    >
                        <svelte:fragment slot="selectionControls">
                            <SelectableStar selected={false} path={image.path} on:selected={albumThumbnailSelected} />
                        </svelte:fragment>
                    </Thumbnail>
                {:else}
                    <div title="💾 Save changes before navigating">
                        <Thumbnail title={image.title} summary={image.summary} src={image.thumbnailUrl} />
                    </div>
                {/if}
            {/each}
        {/if}
    </svelte:fragment>
</DayAlbumPageLayout>

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
