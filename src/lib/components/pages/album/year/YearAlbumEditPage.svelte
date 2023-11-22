<!--
  @component

  Page to edit a year album
-->
<script lang="ts">
    import YearAlbumPageLayout from './YearAlbumPageLayout.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import YearAlbumThumbnails from './YearAlbumThumbnails.svelte';
    import AlbumEditControls from '$lib/components/site/admin/edit_controls/AlbumEditControls.svelte';
    import EditableHtml from '$lib/components/site/admin/EditableHtml.svelte';
    import { editUrl } from '$lib/utils/path-utils';
    import DraftStore from '$lib/stores/DraftStore';
    import type { Album } from '$lib/models/GalleryItemInterfaces';

    export let album: Album;

    let okToNavigate = DraftStore.getOkToNavigate();
</script>

<YearAlbumPageLayout>
    <svelte:fragment slot="editControls">
        <AlbumEditControls published={album.published} />
    </svelte:fragment>

    <svelte:fragment slot="nav">
        <PrevButton href={$okToNavigate ? editUrl(album.nextHref) : undefined} title={album.nextTitle} />
        <UpButton href={$okToNavigate ? '../' : undefined} title="All Years" />
        <NextButton href={$okToNavigate ? editUrl(album.prevHref) : undefined} title={album.prevTitle} />
    </svelte:fragment>

    <svelte:fragment slot="caption">
        <EditableHtml htmlContent={album.description} />
    </svelte:fragment>

    <svelte:fragment slot="thumbnails">
        <YearAlbumThumbnails {album} albumUrlCreator={editUrl} />
    </svelte:fragment>
</YearAlbumPageLayout>
